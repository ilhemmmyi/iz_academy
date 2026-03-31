import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const lessonRouter = Router();

lessonRouter.get('/:id/progress', authenticate, LessonController.getProgress);
lessonRouter.get('/:id/can-unlock', authenticate, LessonController.canUnlock);
lessonRouter.get('/:id/video-url', authenticate, LessonController.getVideoUrl);
lessonRouter.post('/:id/complete', authenticate, LessonController.completeLesson);
lessonRouter.post('/:id/video-progress', authenticate, LessonController.saveVideoProgress);
