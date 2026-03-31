import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { enrollmentRequestSchema, enrollmentStatusSchema } from '../validators/enrollment.validators';

export const enrollmentRouter = Router();

enrollmentRouter.post('/', authenticate, validate(enrollmentRequestSchema), EnrollmentController.request);
enrollmentRouter.get('/', authenticate, requireRole('ADMIN'), EnrollmentController.getAll);
enrollmentRouter.get('/me', authenticate, EnrollmentController.getMyEnrollments);
enrollmentRouter.get('/teacher/students', authenticate, requireRole('TEACHER'), EnrollmentController.getTeacherStudents);
enrollmentRouter.put('/:id', authenticate, requireRole('ADMIN'), validate(enrollmentStatusSchema), EnrollmentController.updateStatus);
