import { Router } from 'express';
import { LessonResourceController } from '../controllers/lessonResource.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { uploadFile } from '../middlewares/upload.middleware';

export const lessonResourceRouter = Router();

// GET /api/lessons/:lessonId/resources — any authenticated user (enrolled student / teacher / admin)
lessonResourceRouter.get('/:lessonId/resources', authenticate, LessonResourceController.getResources);

// POST /api/lessons/:lessonId/resources/file — teacher or admin only
lessonResourceRouter.post('/:lessonId/resources/file', authenticate, requireRole('TEACHER', 'ADMIN'), uploadFile, LessonResourceController.createFileResource);

// POST /api/lessons/:lessonId/resources/link — teacher or admin only
lessonResourceRouter.post('/:lessonId/resources/link', authenticate, requireRole('TEACHER', 'ADMIN'), LessonResourceController.createLinkResource);

// DELETE /api/lessons/resources/:id — teacher or admin only
lessonResourceRouter.delete('/resources/:id', authenticate, requireRole('TEACHER', 'ADMIN'), LessonResourceController.deleteResource);
