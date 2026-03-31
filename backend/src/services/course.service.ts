import { CourseModel } from '../models/course.model';
import { LessonModel } from '../models/lesson.model';
import { ProjectModel } from '../models/project.model';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { withCache } from '../utils/cache';

const invalidateCourseCache = async (courseId?: string) => {
  try {
    if (courseId) await redis.del(`course:${courseId}`);
    // C-3: use SCAN instead of blocking redis.keys()
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await redis.scan(cursor, 'MATCH', 'courses:*', 'COUNT', '100');
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');
    if (keys.length > 0) await redis.del(...keys);
  } catch {}
};

export const CourseService = {

  invalidateCourseCache,

  async getAll(filters?: any) {
    return withCache(`courses:${JSON.stringify(filters || {})}`, () => CourseModel.findAll(filters));
  },

  async getAllAdmin() {
    // M-1: cache admin listing
    return withCache('courses:admin', () => CourseModel.findAllAdmin());
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

    // Step 1: Create course with nested modules + lessons (no quizzes yet)
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

    // Step 2: Create a quiz for each lesson that has quiz questions
    for (let mi = 0; mi < (modules || []).length; mi++) {
      const moduleData = modules[mi];
      const createdModule = course.modules[mi];
      if (!createdModule) continue;

      for (let li = 0; li < (moduleData.lessons || []).length; li++) {
        const lessonData = moduleData.lessons[li];
        const createdLesson = createdModule.lessons[li];
        if (!createdLesson) continue;

        if (lessonData.quiz?.questions?.length > 0) {
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
          await LessonModel.updateQuizId(createdLesson.id, quiz.id);
        }
      }
    }

    // Step 3: Create projects
    if (projects?.length > 0) {
      await Promise.all(
        projects.map((p: any) =>
          ProjectModel.create({
            title: p.title,
            description: p.description || '',
            instructions: p.instructions || '',
            courseId: course.id,
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
    const { modules, objectives, projects, thumbnailUrl, ...rest } = data;

    // 1. Null out lesson quizIds so quizzes can be deleted without FK constraint errors
    await LessonModel.updateManyNullQuizByCourse(id);
    // 2. Delete quiz attempts, quizzes, modules (cascades lessons+progress), projects
    await prisma.quizAttempt.deleteMany({ where: { quiz: { courseId: id } } });
    await prisma.quiz.deleteMany({ where: { courseId: id } });
    await prisma.module.deleteMany({ where: { courseId: id } });
    await ProjectModel.deleteManyByCourse(id);

    // 3. Update scalar fields
    await prisma.course.update({
      where: { id },
      data: {
        ...rest,
        objectives: objectives || [],
        ...(thumbnailUrl !== undefined ? { thumbnailUrl: thumbnailUrl || null } : {}),
      },
    });

    // 4. Re-create modules + lessons + quizzes
    for (let mi = 0; mi < (modules || []).length; mi++) {
      const moduleData = modules[mi];
      const createdModule = await prisma.module.create({
        data: {
          title: moduleData.title,
          order: mi,
          courseId: id,
          lessons: {
            create: (moduleData.lessons || []).map((l: any, li: number) => ({
              title: l.title,
              description: l.description || null,
              videoUrl: l.videoUrl || null,
              order: li,
            })),
          },
        },
        include: { lessons: { orderBy: { order: 'asc' } } },
      });
      for (let li = 0; li < (moduleData.lessons || []).length; li++) {
        const lessonData = moduleData.lessons[li];
        const createdLesson = createdModule.lessons[li];
        if (!createdLesson || !lessonData.quiz?.questions?.length) continue;
        const quiz = await prisma.quiz.create({
          data: {
            courseId: id,
            questions: {
              create: lessonData.quiz.questions.map((q: any) => ({
                text: q.text,
                answers: q.answers,
                correctAnswer: q.correctAnswer,
              })),
            },
          },
        });
        await LessonModel.updateQuizId(createdLesson.id, quiz.id);
      }
    }

    // 5. Re-create projects
    if (projects?.length > 0) {
      await Promise.all(
        projects.map((p: any) =>
          ProjectModel.create({
            title: p.title,
            description: p.description || '',
            instructions: p.instructions || '',
            courseId: id,
          })
        )
      );
    }

    await invalidateCourseCache(id);
    return prisma.course.findUnique({ where: { id } });
  },

  async delete(id: string) {
    await CourseModel.delete(id);
    await invalidateCourseCache(id);
  },

  async getProgress(courseId: string, userId: string) {
    return CourseModel.getProgress(courseId, userId);
  },
};

