import { Router } from 'express';
import { LessonCommentController } from '../controllers/lessonComment.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const lessonCommentRouter = Router();

// Per-lesson endpoints (mounted under /api/lessons)
lessonCommentRouter.get('/:id/comments', authenticate, LessonCommentController.getComments);
lessonCommentRouter.post('/:id/comments', authenticate, LessonCommentController.createComment);

// Comment-level endpoints
lessonCommentRouter.post('/comments/:commentId/reply', authenticate, LessonCommentController.replyToComment);
lessonCommentRouter.delete('/comments/:commentId', authenticate, LessonCommentController.deleteComment);

// Teacher: all comments for a course
lessonCommentRouter.get('/comments/course/:courseId', authenticate, LessonCommentController.getCourseComments);
