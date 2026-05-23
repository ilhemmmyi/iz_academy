import { CourseModel } from '../models/course.model';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { withCache } from '../utils/cache';
import { CourseSnapshotService } from './courseSnapshot.service';
import { Prisma } from '@prisma/client';

const COURSES_KEYS_SET = 'cache:courses:keys';

type PrismaTx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const withCourseCache = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  try { await redis.sadd(COURSES_KEYS_SET, key); } catch {}
  return withCache(key, fn);
};

const invalidateCourseCache = async (courseId?: string) => {
  try {
    if (courseId) await redis.del(`course:${courseId}`);
    const keys = await redis.smembers(COURSES_KEYS_SET);
    if (keys.length > 0) await redis.del(...keys);
    await redis.del(COURSES_KEYS_SET);
  } catch {}
};

// ─────────────────────────────────────────────────────────────────────────────
// Quiz upsert — updates questions in-place preserving the quizId (and therefore
// all QuizAttempt records). Creates a new quiz only when the lesson had none.
// ─────────────────────────────────────────────────────────────────────────────
async function upsertQuiz(
  lessonId: string,
  courseId: string,
  quizData: any,
  existingQuizId: string | null | undefined,
  tx: PrismaTx,
): Promise<void> {
  const hasQuestions = Array.isArray(quizData?.questions) && quizData.questions.length > 0;

  if (!hasQuestions) {
    // Admin removed the quiz — only unlink (SetNull), never delete, preserves QuizAttempts.
    if (existingQuizId) {
      await tx.lesson.update({ where: { id: lessonId }, data: { quizId: null } });
    }
    return;
  }

  if (existingQuizId) {
    // Keep the same quizId so existing QuizAttempts remain valid.
    // Replace questions content in-place.
    await tx.question.deleteMany({ where: { quizId: existingQuizId } });
    await tx.question.createMany({
      data: quizData.questions.map((q: any) => ({
        quizId: existingQuizId,
        text: q.text,
        answers: q.answers,
        correctAnswer: q.correctAnswer,
      })),
    });
  } else {
    const quiz = await tx.quiz.create({
      data: {
        courseId,
        questions: {
          create: quizData.questions.map((q: any) => ({
            text: q.text,
            answers: q.answers,
            correctAnswer: q.correctAnswer,
          })),
        },
      },
    });
    await tx.lesson.update({ where: { id: lessonId }, data: { quizId: quiz.id } });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson diff-upsert within one module.
// Lessons present in payload → create or update.
// Lessons missing from payload → soft-archive (LessonProgress is preserved).
// ─────────────────────────────────────────────────────────────────────────────
async function upsertLessons(
  moduleId: string,
  courseId: string,
  incomingLessons: any[],
  tx: PrismaTx,
): Promise<void> {
  const existing = await tx.lesson.findMany({
    where: { moduleId, archivedAt: null },
    include: { quiz: { select: { id: true } } },
  });
  const existingById = new Map(existing.map(l => [l.id, l]));
  const processedIds = new Set<string>();

  for (let li = 0; li < incomingLessons.length; li++) {
    const lData = incomingLessons[li];
    const dbLesson = lData.id ? existingById.get(lData.id) : undefined;

    if (dbLesson) {
      // Update existing lesson — keeps its ID, so LessonProgress is untouched.
      await tx.lesson.update({
        where: { id: dbLesson.id },
        data: {
          title: lData.title,
          description: lData.description || null,
          videoUrl: lData.videoUrl || null,
          order: li,
        },
      });
      processedIds.add(dbLesson.id);
      await upsertQuiz(dbLesson.id, courseId, lData.quiz, dbLesson.quizId, tx);
    } else {
      // New lesson — create with a fresh ID.
      const created = await tx.lesson.create({
        data: {
          title: lData.title,
          description: lData.description || null,
          videoUrl: lData.videoUrl || null,
          order: li,
          moduleId,
        },
      });
      processedIds.add(created.id);
      if (lData.quiz?.questions?.length) {
        await upsertQuiz(created.id, courseId, lData.quiz, null, tx);
      }
    }
  }

  // Soft-archive lessons removed from the payload — never hard-delete them.
  const toArchive = existing.filter(l => !processedIds.has(l.id)).map(l => l.id);
  if (toArchive.length > 0) {
    await tx.lesson.updateMany({
      where: { id: { in: toArchive } },
      data: { archivedAt: new Date() },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module diff-upsert.
// Modules present in payload → create or update, then recurse into lessons.
// Modules missing from payload → soft-archive (cascades to their lessons).
// ─────────────────────────────────────────────────────────────────────────────
async function upsertModules(
  courseId: string,
  incomingModules: any[],
  tx: PrismaTx,
): Promise<void> {
  const existing = await tx.module.findMany({
    where: { courseId, archivedAt: null },
  });
  const existingById = new Map(existing.map(m => [m.id, m]));
  const processedIds = new Set<string>();

  for (let mi = 0; mi < incomingModules.length; mi++) {
    const mData = incomingModules[mi];
    const dbModule = mData.id ? existingById.get(mData.id) : undefined;

    let moduleId: string;
    if (dbModule) {
      await tx.module.update({
        where: { id: dbModule.id },
        data: { title: mData.title, order: mi },
      });
      moduleId = dbModule.id;
      processedIds.add(moduleId);
    } else {
      const created = await tx.module.create({
        data: { title: mData.title, order: mi, courseId },
      });
      moduleId = created.id;
      processedIds.add(moduleId);
    }

    await upsertLessons(moduleId, courseId, mData.lessons || [], tx);
  }

  // Soft-archive modules removed from the payload.
  const toArchive = existing.filter(m => !processedIds.has(m.id)).map(m => m.id);
  if (toArchive.length > 0) {
    await tx.module.updateMany({
      where: { id: { in: toArchive } },
      data: { archivedAt: new Date() },
    });
    // Cascade soft-archive to all their active lessons.
    await tx.lesson.updateMany({
      where: { moduleId: { in: toArchive }, archivedAt: null },
      data: { archivedAt: new Date() },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Project diff-upsert.
// Projects with existing IDs → update in-place.
// New projects → create.
// Removed projects → delete ONLY if they have zero submissions; otherwise
// soft-archive so existing ProjectSubmissions are never orphaned.
// ─────────────────────────────────────────────────────────────────────────────
async function upsertProjects(
  courseId: string,
  incomingProjects: any[],
  tx: PrismaTx,
): Promise<void> {
  const existing = await tx.project.findMany({
    where: { courseId, archivedAt: null },
  });
  const existingById = new Map(existing.map(p => [p.id, p]));
  const processedIds = new Set<string>();

  for (const pData of incomingProjects) {
    if (!pData.title?.trim()) continue;

    const dbProject = pData.id ? existingById.get(pData.id) : undefined;
    if (dbProject) {
      await tx.project.update({
        where: { id: dbProject.id },
        data: {
          title: pData.title,
          description: pData.description || '',
          instructions: pData.instructions || '',
        },
      });
      processedIds.add(dbProject.id);
    } else {
      const created = await tx.project.create({
        data: {
          title: pData.title,
          description: pData.description || '',
          instructions: pData.instructions || '',
          courseId,
        },
      });
      processedIds.add(created.id);
    }
  }

  const toRemove = existing.filter(p => !processedIds.has(p.id));
  for (const project of toRemove) {
    const subCount = await tx.projectSubmission.count({ where: { projectId: project.id } });
    if (subCount === 0) {
      await tx.project.delete({ where: { id: project.id } });
    } else {
      // Has student submissions — soft-archive instead of deleting.
      await tx.project.update({
        where: { id: project.id },
        data: { archivedAt: new Date() },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public service
// ─────────────────────────────────────────────────────────────────────────────
export const CourseService = {

  invalidateCourseCache,

  async getAll(filters?: any) {
    return withCourseCache(`courses:${JSON.stringify(filters || {})}`, () => CourseModel.findAll(filters));
  },

  async getMine(teacherId: string) {
    return CourseModel.findByTeacher(teacherId);
  },

  async getAllAdmin() {
    return withCourseCache('courses:admin', () => CourseModel.findAllAdmin());
  },

  async getById(id: string) {
    return withCache(`course:${id}`, async () => {
      const course = await CourseModel.findById(id);
      if (!course) throw new Error('COURSE_NOT_FOUND');
      return course;
    });
  },

  async create(data: any) {
    const { modules, objectives, projects, ...rest } = data;

    const course = await prisma.course.create({
      data: {
        ...rest,
        objectives: objectives || [],
        modules: {
          create: (modules || []).map((m: any, i: number) => ({
            title: m.title,
            order: i,
            lessons: {
              create: (m.lessons || []).map((l: any, j: number) => ({
                title: l.title,
                description: l.description || null,
                videoUrl: l.videoUrl || null,
                order: j,
              })),
            },
          })),
        },
      },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    });

    for (let mi = 0; mi < (modules || []).length; mi++) {
      const moduleData = modules[mi];
      const createdModule = course.modules[mi];
      if (!createdModule) continue;

      for (let li = 0; li < (moduleData.lessons || []).length; li++) {
        const lessonData = moduleData.lessons[li];
        const createdLesson = createdModule.lessons[li];
        if (!createdLesson || !lessonData.quiz?.questions?.length) continue;

        const quiz = await prisma.quiz.create({
          data: {
            courseId: course.id,
            questions: {
              create: lessonData.quiz.questions.map((q: any) => ({
                text: q.text,
                answers: q.answers,
                correctAnswer: q.correctAnswer,
              })),
            },
          },
        });
        await prisma.lesson.update({ where: { id: createdLesson.id }, data: { quizId: quiz.id } });
      }
    }

    if (projects?.length > 0) {
      await Promise.all(
        projects.map((p: any) =>
          prisma.project.create({
            data: {
              title: p.title,
              description: p.description || '',
              instructions: p.instructions || '',
              courseId: course.id,
            },
          })
        )
      );
    }

    await invalidateCourseCache();
    return course;
  },

  async update(id: string, data: any, requesterId: string, requesterRole: string) {
    const course = await CourseModel.findById(id);
    if (!course) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
    if (requesterRole !== 'ADMIN' && course.teacherId !== requesterId) {
      throw Object.assign(new Error('FORBIDDEN'), { status: 403 });
    }

    const { modules, objectives, projects, thumbnailUrl, ...scalars } = data;

    // ── Phase 1: Scalar update — always safe, never touches student data ──────
    await prisma.course.update({
      where: { id },
      data: {
        ...scalars,
        ...(objectives !== undefined ? { objectives } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl: thumbnailUrl || null } : {}),
      },
    });

    // ── Phase 2: Content update — only runs when modules or projects changed ──
    const hasContentChange = modules !== undefined || projects !== undefined;
    if (hasContentChange) {
      await prisma.$transaction(
        async (tx) => {
          // 2a. Snapshot CURRENT version before any changes.
          const current = await tx.course.findUnique({
            where: { id },
            select: { contentVersion: true },
          });
          const currentVersion = current!.contentVersion;

          await CourseSnapshotService.capture(id, currentVersion, tx as unknown as typeof prisma);

          // 2b. Increment contentVersion so new enrollments see the new content.
          await tx.course.update({
            where: { id },
            data: { contentVersion: { increment: 1 } },
          });

          // 2c. Diff-upsert modules + lessons + quizzes.
          if (modules !== undefined) {
            await upsertModules(id, modules, tx as unknown as typeof prisma);
          }

          // 2d. Diff-upsert projects.
          if (projects !== undefined) {
            await upsertProjects(id, projects, tx as unknown as typeof prisma);
          }
        },
        { timeout: 30_000 },
      );
    }

    await invalidateCourseCache(id);
    return prisma.course.findUnique({ where: { id } });
  },

  async delete(id: string) {
    await CourseModel.delete(id);
    await invalidateCourseCache(id);
  },

  async getProgress(courseId: string, userId: string, snapshotLessonIds?: string[]) {
    return CourseModel.getProgress(courseId, userId, snapshotLessonIds);
  },
};
