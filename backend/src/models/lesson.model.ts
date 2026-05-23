import { prisma } from '../config/prisma';

export const LessonModel = {

  findById: (id: string) =>
    prisma.lesson.findUnique({
      where: { id },
      include: { module: true },
    }),

  findByIdWithModule: (id: string) =>
    prisma.lesson.findUnique({
      where: { id },
      select: { order: true, moduleId: true },
    }),

  findPrevious: (moduleId: string, order: number) =>
    prisma.lesson.findFirst({
      where: { moduleId, order: { lt: order }, archivedAt: null },
      orderBy: { order: 'desc' },
      select: { id: true, quizId: true },
    }),

  /**
   * Find the lesson that immediately precedes `lessonId` across all modules in
   * the same course. Only considers non-archived lessons (current version view).
   */
  findPreviousGlobal: async (lessonId: string) => {
    const current = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { order: true, module: { select: { order: true, courseId: true } } },
    });
    if (!current) return undefined;

    const all = await prisma.lesson.findMany({
      where: {
        module: { courseId: current.module.courseId },
        archivedAt: null,
      },
      select: { id: true, quizId: true, order: true, module: { select: { order: true } } },
      orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
    });

    const idx = all.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return null;
    return all[idx - 1];
  },

  // LessonProgress queries
  getProgress: (userId: string, lessonId: string) =>
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    }),

  upsertProgress: (userId: string, lessonId: string, data: {
    completed?: boolean;
    completedAt?: Date;
    watchedSeconds?: number;
    durationSeconds?: number;
  }) =>
    prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: data,
      create: { userId, lessonId, ...data },
    }),

  // Count completed non-archived lessons in a course for a student.
  countCompleted: (userId: string, courseId: string) =>
    prisma.lessonProgress.count({
      where: {
        userId,
        lesson: { module: { courseId }, archivedAt: null },
        completed: true,
      },
    }),

  // Count completed lessons from an explicit list of IDs (used for snapshot/old-version students).
  countCompletedByIds: (userId: string, lessonIds: string[]) =>
    prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        completed: true,
      },
    }),

  getAllProgress: (userId: string, courseId: string) =>
    prisma.lessonProgress.findMany({
      where: { userId, lesson: { module: { courseId } } },
    }),

  findCompletedByCourseIds: (studentIds: string[], courseIds: string[]) =>
    prisma.lessonProgress.findMany({
      where: {
        userId: { in: studentIds },
        lesson: { module: { courseId: { in: courseIds } }, archivedAt: null },
        completed: true,
      },
      include: { lesson: { select: { moduleId: true, durationSeconds: true, module: { select: { courseId: true } } } } },
    }),

  updateQuizId: (id: string, quizId: string | null) =>
    prisma.lesson.update({
      where: { id },
      data: { quizId },
    }),

  // Kept for backwards compat — no longer called by course update but may be used elsewhere.
  updateManyNullQuizByCourse: (courseId: string) =>
    prisma.lesson.updateMany({
      where: { module: { courseId } },
      data: { quizId: null },
    }),

  findWithQuiz: (lessonId: string) =>
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { quiz: { include: { questions: true } } },
    }),

  updateDuration: (lessonId: string, durationSeconds: number) =>
    prisma.lesson.update({
      where: { id: lessonId },
      data: { durationSeconds },
    }),
};
