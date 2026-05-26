import { prisma } from '../config/prisma';
import { LessonModel } from '../models/lesson.model';
import { EnrollmentModel } from '../models/enrollment.model';
import { config } from '../config';

export const QuizService = {
  getByCourse: (courseId: string) =>
    prisma.quiz.findFirst({ where: { courseId }, include: { questions: true } }),

  async getByLesson(lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        quiz: { include: { questions: true } },
        module: { select: { courseId: true } },
      },
    });
    if (!lesson) return null;

    const enrolled = await EnrollmentModel.findApproved(userId, lesson.module.courseId);
    if (!enrolled) throw new Error('NOT_ENROLLED');
    if (enrolled.accessExpiresAt && enrolled.accessExpiresAt < new Date()) throw new Error('ACCESS_EXPIRED');

    const progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { completed: true },
    });
    if (!progress?.completed) throw new Error('LESSON_NOT_COMPLETED');

    return lesson.quiz || null;
  },

  async submitAttempt(quizId: string, userId: string, answers: Record<string, number>) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true, lessons: true },
    });
    if (!quiz) throw new Error('QUIZ_NOT_FOUND');

    const enrolled = await EnrollmentModel.findApproved(userId, quiz.courseId);
    if (!enrolled) throw new Error('NOT_ENROLLED');
    if (enrolled.accessExpiresAt && enrolled.accessExpiresAt < new Date()) throw new Error('ACCESS_EXPIRED');

    // All lessons associated with this quiz must be completed first
    if (quiz.lessons.length > 0) {
      const lessonIds = quiz.lessons.map((l: any) => l.id);
      const completedCount = await prisma.lessonProgress.count({
        where: { userId, lessonId: { in: lessonIds }, completed: true },
      });
      if (completedCount < lessonIds.length) throw new Error('LESSON_NOT_COMPLETED');
    }

    let correct = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    const score = quiz.questions.length > 0 ? (correct / quiz.questions.length) * 100 : 0;
    const passed = score >= config.quizPassThreshold;
    const attempt = await prisma.quizAttempt.create({ data: { userId, quizId, score, passed } });

    // Auto-complete associated lessons when quiz is passed
    if (passed && quiz.lessons.length > 0) {
      await Promise.all(
        quiz.lessons.map((lesson: any) =>
          LessonModel.upsertProgress(userId, lesson.id, { completed: true, completedAt: new Date() })
        )
      );
    }

    return { ...attempt, score, passed };
  },
};
