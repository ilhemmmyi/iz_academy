import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

export const userRouter = Router();

userRouter.get('/me', authenticate, UserController.getMe);
userRouter.patch('/me/complete-coach', authenticate, UserController.completeCoach);
userRouter.put('/me', authenticate, UserController.updateMe);
userRouter.get('/me/certificates', authenticate, UserController.getMyCertificates);
userRouter.get('/me/certificates/:id/pdf', authenticate, UserController.streamCertificatePdf);
userRouter.get('/me/certificates/:id', authenticate, UserController.getCertificateById);
userRouter.post('/me/certificates/:courseId/retry', authenticate, UserController.retryCertificate);
userRouter.get('/', authenticate, requireRole('ADMIN'), UserController.getAll);
userRouter.post('/', authenticate, requireRole('ADMIN'), UserController.createUser);
userRouter.get('/:id/overview', authenticate, requireRole('ADMIN'), UserController.getStudentOverview);
userRouter.put('/:id/courses', authenticate, requireRole('ADMIN'), UserController.assignCourses);
userRouter.delete('/:id/enrollments/:courseId', authenticate, requireRole('ADMIN'), UserController.removeStudentCourseAccess);
userRouter.put('/:id', authenticate, requireRole('ADMIN'), UserController.updateUser);
userRouter.post('/:id/reset-password', authenticate, requireRole('ADMIN'), UserController.resetPassword);
userRouter.delete('/:id', authenticate, requireRole('ADMIN'), UserController.deleteUser);
userRouter.delete('/:userId/certificates/:courseId', authenticate, requireRole('ADMIN'), UserController.revokecertificate);
