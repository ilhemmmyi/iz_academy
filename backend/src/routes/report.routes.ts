import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

export const reportRouter = Router();

// Any authenticated user can submit a report
reportRouter.post('/', authenticate, ReportController.create);

// Admin only: list all reports
reportRouter.get('/', authenticate, requireRole('ADMIN'), ReportController.getAll);

// Admin only: mark a report as reviewed
reportRouter.put('/:id/review', authenticate, requireRole('ADMIN'), ReportController.markReviewed);
