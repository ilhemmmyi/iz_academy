import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { QuizService } from '../services/quiz.service';

export const QuizController = {

  async getByCourse(req: AuthRequest, res: Response) {
    try {
      const quiz = await QuizService.getByCourse(String(req.params.courseId));
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      res.json(quiz);
    } catch {
      res.status(500).json({ message: 'Failed to fetch quiz' });
    }
  },

  async getByLesson(req: AuthRequest, res: Response) {
    try {
      const quiz = await QuizService.getByLesson(String(req.params.lessonId));
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      res.json(quiz);
    } catch {
      res.status(500).json({ message: 'Failed to fetch quiz' });
    }
  },

  async submitAttempt(req: AuthRequest, res: Response) {
    try {
      const { answers } = req.body;
      const attempt = await QuizService.submitAttempt(String(req.params.quizId), req.user!.userId, answers);
      res.json(attempt);
    } catch (err: any) {
      if (err.message === 'QUIZ_NOT_FOUND') return res.status(404).json({ message: 'Quiz not found' });
      if (err.message === 'NOT_ENROLLED') return res.status(403).json({ message: 'You are not enrolled in this course' });
      res.status(500).json({ message: 'Failed to submit quiz' });
    }
  },
};
