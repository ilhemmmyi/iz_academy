import { prisma } from '../config/prisma';
import { LessonModel } from '../models/lesson.model';
import { EnrollmentModel } from '../models/enrollment.model';

export const QuizService = {
  getByCourse: (courseId: string) =>
    prisma.quiz.findFirst({ where: { courseId }, include: { questions: true } }),

  getByLesson: async (lessonId: string) => {
    const lesson = await LessonModel.findWithQuiz(lessonId);
    return lesson?.quiz || null;
  },

  async submitAttempt(quizId: string, userId: string, answers: Record<string, number>) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true, lessons: true },
    });
    if (!quiz) throw new Error('QUIZ_NOT_FOUND');
    const enrolled = await EnrollmentModel.findApproved(userId, quiz.courseId);
    if (!enrolled) throw new Error('NOT_ENROLLED');
    let correct = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    const score = quiz.questions.length > 0 ? (correct / quiz.questions.length) * 100 : 0;
    const passed = score >= 70;
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
