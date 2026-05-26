import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { quizAttemptLimiter } from '../middlewares/rate-limit.middleware';

export const quizRouter = Router();

quizRouter.get('/lesson/:lessonId', authenticate, QuizController.getByLesson);
quizRouter.get('/:courseId', authenticate, QuizController.getByCourse);
quizRouter.post('/:quizId/attempt', authenticate, quizAttemptLimiter, QuizController.submitAttempt);
