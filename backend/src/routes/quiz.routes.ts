import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';
import { authenticate } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

export const quizRouter = Router();

const quizAttemptLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

quizRouter.get('/lesson/:lessonId', authenticate, QuizController.getByLesson);
quizRouter.get('/:courseId', authenticate, QuizController.getByCourse);
quizRouter.post('/:quizId/attempt', authenticate, quizAttemptLimiter, QuizController.submitAttempt);
