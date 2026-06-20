import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { QuizService } from '../services/quiz.service';

export const QuizController = {

  async getByCourse(req: AuthRequest, res: Response) {
    try {
      const quiz = await QuizService.getByCourse(String(req.params.courseId));
      if (!quiz) return res.status(404).json({ message: 'Quiz introuvable' });
      res.json(quiz);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération du quiz' });
    }
  },

  async getByLesson(req: AuthRequest, res: Response) {
    try {
      const quiz = await QuizService.getByLesson(String(req.params.lessonId), req.user!.userId);
      if (!quiz) return res.status(404).json({ message: 'Quiz introuvable' });
      res.json(quiz);
    } catch (err: any) {
      if (err.message === 'NOT_ENROLLED') return res.status(403).json({ message: 'Vous n\'êtes pas inscrit à ce cours' });
      if (err.message === 'ACCESS_EXPIRED') return res.status(403).json({ message: 'Votre accès à ce cours a expiré' });
      if (err.message === 'LESSON_NOT_COMPLETED') return res.status(403).json({ message: 'Vous devez terminer la leçon avant de passer le quiz' });
      res.status(500).json({ message: 'Échec de la récupération du quiz' });
    }
  },

  async submitAttempt(req: AuthRequest, res: Response) {
    try {
      const { answers } = req.body;
      const attempt = await QuizService.submitAttempt(String(req.params.quizId), req.user!.userId, answers);
      res.json(attempt);
    } catch (err: any) {
      if (err.message === 'QUIZ_NOT_FOUND') return res.status(404).json({ message: 'Quiz introuvable' });
      if (err.message === 'NOT_ENROLLED') return res.status(403).json({ message: 'Vous n\'êtes pas inscrit à ce cours' });
      if (err.message === 'ACCESS_EXPIRED') return res.status(403).json({ message: 'Votre accès à ce cours a expiré' });
      if (err.message === 'LESSON_NOT_COMPLETED') return res.status(403).json({ message: 'Vous devez terminer la leçon avant de passer le quiz' });
      res.status(500).json({ message: 'Échec de la soumission du quiz' });
    }
  },
};
