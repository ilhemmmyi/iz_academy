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
      where: { moduleId, order: { lt: order } },
      orderBy: { order: 'desc' },
      select: { id: true, quizId: true },
    }),

  /** Find the lesson that immediately precedes `lessonId` across all modules in the same course. */
  findPreviousGlobal: async (lessonId: string) => {
    const current = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { order: true, module: { select: { order: true, courseId: true } } },
    });
    if (!current) return undefined; // lesson not found

    const all = await prisma.lesson.findMany({
      where: { module: { courseId: current.module.courseId } },
      select: { id: true, quizId: true, order: true, module: { select: { order: true } } },
      orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
    });

    const idx = all.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return null; // first lesson globally → no predecessor
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

  countCompleted: (userId: string, courseId: string) =>
    prisma.lessonProgress.count({
      where: {
        userId,
        lesson: { module: { courseId } },
        completed: true,
      },
    }),

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
        lesson: { module: { courseId: { in: courseIds } } },
        completed: true,
      },
      include: { lesson: { select: { moduleId: true, durationSeconds: true, module: { select: { courseId: true } } } } },
    }),

  updateQuizId: (id: string, quizId: string | null) =>
    prisma.lesson.update({
      where: { id },
      data: { quizId },
    }),

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
};
