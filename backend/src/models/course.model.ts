import { prisma } from '../config/prisma';

export const CourseModel = {
  findAll: (filters?: any) => prisma.course.findMany({
    where: { isPublished: true, ...filters },
    select: {
      id: true, title: true, shortDescription: true, thumbnailUrl: true,
      price: true, level: true, duration: true, createdAt: true, isPublished: true,
      category: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      // C-5: use counts instead of loading every lesson row
      _count: { select: { modules: true } },
      modules: {
        select: {
          id: true, title: true, order: true,
          _count: { select: { lessons: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  }),

  findByTeacher: (teacherId: string) => prisma.course.findMany({
    where: { teacherId },
    select: {
      id: true, title: true, shortDescription: true, thumbnailUrl: true,
      price: true, level: true, duration: true, createdAt: true, isPublished: true,
      teacherId: true,
      category: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      _count: { select: { modules: true } },
      modules: {
        select: {
          id: true, title: true, order: true,
          _count: { select: { lessons: true } },
          lessons: { orderBy: { order: 'asc' }, select: { id: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  }),

  findAllAdmin: () => prisma.course.findMany({
    select: {
      id: true, title: true, shortDescription: true, thumbnailUrl: true,
      price: true, level: true, duration: true, createdAt: true, isPublished: true,
      category: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      _count: { select: { modules: true } },
      modules: {
        select: {
          id: true, title: true, order: true,
          _count: { select: { lessons: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  }),

  findById: (id: string) => prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      teacher: { select: { id: true, name: true, avatarUrl: true } },
      modules: {
        include: {
          lessons: {
            include: {
              quiz: { include: { questions: true } },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      projects: { orderBy: { createdAt: 'asc' } },
    },
  }),

  create: (data: any) => prisma.course.create({ data }),

  update: (id: string, data: any) => prisma.course.update({ where: { id }, data }),

  delete: (id: string) => prisma.course.delete({ where: { id } }),

  getProgress: async (courseId: string, userId: string) => {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } },
    });
    if (!course) return { total: 0, completed: 0, percentage: 0, completedLessonIds: [], videoProgress: {}, passedQuizLessonIds: [] };
    const allLessons = course.modules.flatMap(m => m.lessons);
    const totalLessons = allLessons.length;
    const allProgress = await prisma.lessonProgress.findMany({
      where: { userId, lesson: { module: { courseId } } },
    });
    const completedLessonIds = allProgress.filter(p => p.completed).map(p => p.lessonId);
    const videoProgress: Record<string, { watchedSeconds: number; durationSeconds: number }> = {};
    for (const p of allProgress) {
      videoProgress[p.lessonId] = { watchedSeconds: p.watchedSeconds, durationSeconds: p.durationSeconds };
    }

    // Build a map of lesson durations from the Lesson table for ALL lessons (even unvisited)
    // Also query LessonProgress across ALL users to find the best-known duration per lesson
    // (Lesson.durationSeconds may still be 0 if the lesson was just created and no one has finished it)
    const allKnownProgress = await prisma.lessonProgress.groupBy({
      by: ['lessonId'],
      where: { lesson: { module: { courseId } } },
      _max: { durationSeconds: true },
    });
    const knownDurationsFromProgress: Record<string, number> = {};
    for (const p of allKnownProgress) {
      knownDurationsFromProgress[p.lessonId] = p._max.durationSeconds ?? 0;
    }

    const lessonDurations: Record<string, number> = {};
    for (const l of allLessons) {
      // Use the highest value from either the Lesson row or any user's progress record
      lessonDurations[l.id] = Math.max(l.durationSeconds ?? 0, knownDurationsFromProgress[l.id] ?? 0);
    }

    // Determine which lessons' quizzes the student has passed
    const passedQuizLessonIds: string[] = [];
    const lessonsWithQuizzes = allLessons.filter(l => l.quizId);
    if (lessonsWithQuizzes.length > 0) {
      const quizIds = lessonsWithQuizzes.map(l => l.quizId as string);
      const passedAttempts = await prisma.quizAttempt.findMany({
        where: { userId, quizId: { in: quizIds }, passed: true },
        select: { quizId: true },
        distinct: ['quizId'],
      });
      const passedQuizIds = new Set(passedAttempts.map(a => a.quizId));
      for (const lesson of lessonsWithQuizzes) {
        if (lesson.quizId && passedQuizIds.has(lesson.quizId)) {
          passedQuizLessonIds.push(lesson.id);
        }
      }
    }

    return {
      total: totalLessons,
      completed: completedLessonIds.length,
      percentage: totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0,
      completedLessonIds,
      videoProgress,
      passedQuizLessonIds,
      lessonDurations,
    };
  },
};
