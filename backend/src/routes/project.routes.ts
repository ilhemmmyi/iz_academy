import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

export const projectRouter = Router();

// ─── Student ───────────────────────────────────────────────────────────────────
// Submit a project (must have completed all lessons)
projectRouter.post('/:projectId/submit', authenticate, requireRole('STUDENT'), ProjectController.submit);
// Get my submissions
projectRouter.get('/my-submissions', authenticate, requireRole('STUDENT'), ProjectController.mySubmissions);
// Delete own submission (within grace period)
projectRouter.delete('/submissions/:submissionId', authenticate, requireRole('STUDENT'), ProjectController.deleteSubmission);

// ─── Teacher ───────────────────────────────────────────────────────────────────
// Get all submissions for own courses
projectRouter.get('/teacher/submissions', authenticate, requireRole('TEACHER', 'ADMIN'), ProjectController.teacherSubmissions);
// Review a submission (VALIDATED or NEEDS_IMPROVEMENT)
projectRouter.put('/submissions/:submissionId/review', authenticate, requireRole('TEACHER', 'ADMIN'), ProjectController.review);

// ─── Admin ─────────────────────────────────────────────────────────────────────
// List submissions validated by teacher but awaiting admin approval
projectRouter.get('/submissions/pending-approval', authenticate, requireRole('ADMIN'), ProjectController.listValidatedPendingApproval);
// Give final authorization — triggers certificate generation
projectRouter.put('/submissions/:submissionId/admin-approve', authenticate, requireRole('ADMIN'), ProjectController.adminApprove);
