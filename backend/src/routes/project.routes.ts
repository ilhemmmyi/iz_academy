import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

export const projectRouter = Router();

// Student 
projectRouter.post('/:projectId/submit', authenticate, requireRole('STUDENT'), ProjectController.submit);
projectRouter.get('/my-submissions', authenticate, requireRole('STUDENT'), ProjectController.mySubmissions);
projectRouter.delete('/submissions/:submissionId', authenticate, requireRole('STUDENT'), ProjectController.deleteSubmission);

// Teacher
projectRouter.get('/teacher/submissions', authenticate, requireRole('TEACHER', 'ADMIN'), ProjectController.teacherSubmissions);
projectRouter.put('/submissions/:submissionId/review', authenticate, requireRole('TEACHER', 'ADMIN'), ProjectController.review);

// Admin 
projectRouter.get('/submissions/pending-approval', authenticate, requireRole('ADMIN'), ProjectController.listValidatedPendingApproval);
