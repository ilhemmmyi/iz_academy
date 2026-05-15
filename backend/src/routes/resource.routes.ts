import { Router } from 'express';
import { ResourceController } from '../controllers/resource.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { uploadFile } from '../middlewares/upload.middleware';

export const resourceRouter = Router();

// GET /api/courses/:courseId/resources  — teacher or enrolled student
resourceRouter.get('/:courseId/resources', authenticate, ResourceController.getResources);

// POST /api/courses/:courseId/resources — teacher only
resourceRouter.post('/:courseId/resources', authenticate, requireRole('TEACHER', 'ADMIN'), uploadFile, ResourceController.createResource);

// DELETE /api/resources/:id — teacher only
resourceRouter.delete('/resources/:id', authenticate, requireRole('TEACHER', 'ADMIN'), ResourceController.deleteResource);
