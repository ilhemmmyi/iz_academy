import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { upload } from '../middlewares/upload.middleware';
import { adminActionLimiter, certificateRetryLimiter, uploadLimiter } from '../middlewares/rate-limit.middleware';

export const userRouter = Router();

userRouter.get('/me', authenticate, UserController.getMe);
userRouter.post('/me/change-password', authenticate, UserController.changePassword);
userRouter.patch('/me/complete-coach', authenticate, UserController.completeCoach);
userRouter.put('/me', authenticate, UserController.updateMe);
userRouter.get('/me/certificates', authenticate, UserController.getMyCertificates);
userRouter.get('/me/certificates/:id/pdf', authenticate, UserController.streamCertificatePdf);
userRouter.get('/me/certificates/:id', authenticate, UserController.getCertificateById);
userRouter.post('/me/certificates/:courseId/retry', authenticate, certificateRetryLimiter, UserController.retryCertificate);
userRouter.put('/me/avatar', authenticate, uploadLimiter, upload.single('avatar'), UserController.updateAvatar);
userRouter.delete('/me/avatar', authenticate, UserController.deleteAvatar);

userRouter.get('/', authenticate, requireRole('ADMIN'), UserController.getAll);
userRouter.post('/', authenticate, requireRole('ADMIN'), adminActionLimiter, UserController.createUser);
userRouter.get('/:id/overview', authenticate, requireRole('ADMIN'), UserController.getStudentOverview);
userRouter.get('/:id/eligible-courses', authenticate, requireRole('ADMIN'), UserController.getEligibleCourses);
userRouter.put('/:id/courses', authenticate, requireRole('ADMIN'), adminActionLimiter, UserController.assignCourses);
userRouter.delete('/:id/enrollments/:courseId', authenticate, requireRole('ADMIN'), adminActionLimiter, UserController.removeStudentCourseAccess);
userRouter.put('/:id', authenticate, requireRole('ADMIN'), adminActionLimiter, UserController.updateUser);
userRouter.post('/:id/reset-password', authenticate, requireRole('ADMIN'), adminActionLimiter, UserController.resetPassword);
userRouter.delete('/:id', authenticate, requireRole('ADMIN'), adminActionLimiter, UserController.deleteUser);
userRouter.delete('/:userId/certificates/:courseId', authenticate, requireRole('ADMIN'), adminActionLimiter, UserController.revokecertificate);
