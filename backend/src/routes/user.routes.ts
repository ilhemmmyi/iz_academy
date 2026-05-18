import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { upload } from '../middlewares/upload.middleware';
export const userRouter = Router();

// Stricter limiter for account creation — prevents bulk scripting abuse
const createUserLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de comptes créés. Réessayez dans 10 minutes.' },
});

userRouter.get('/me', authenticate, UserController.getMe);
userRouter.post('/me/change-password', authenticate, UserController.changePassword);
userRouter.patch('/me/complete-coach', authenticate, UserController.completeCoach);
userRouter.put('/me', authenticate, UserController.updateMe);
userRouter.get('/me/certificates', authenticate, UserController.getMyCertificates);
userRouter.get('/me/certificates/:id/pdf', authenticate, UserController.streamCertificatePdf);
userRouter.get('/me/certificates/:id', authenticate, UserController.getCertificateById);
userRouter.post('/me/certificates/:courseId/retry', authenticate, UserController.retryCertificate);
userRouter.get('/', authenticate, requireRole('ADMIN'), UserController.getAll);
userRouter.post('/', authenticate, requireRole('ADMIN'), createUserLimiter, UserController.createUser);
userRouter.get('/:id/overview', authenticate, requireRole('ADMIN'), UserController.getStudentOverview);
userRouter.get('/:id/eligible-courses', authenticate, requireRole('ADMIN'), UserController.getEligibleCourses);
userRouter.put('/:id/courses', authenticate, requireRole('ADMIN'), UserController.assignCourses);
userRouter.delete('/:id/enrollments/:courseId', authenticate, requireRole('ADMIN'), UserController.removeStudentCourseAccess);
userRouter.put('/:id', authenticate, requireRole('ADMIN'), UserController.updateUser);
userRouter.post('/:id/reset-password', authenticate, requireRole('ADMIN'), UserController.resetPassword);
userRouter.delete('/:id', authenticate, requireRole('ADMIN'), UserController.deleteUser);
userRouter.delete('/:userId/certificates/:courseId', authenticate, requireRole('ADMIN'), UserController.revokecertificate);
userRouter.put('/me/avatar', authenticate, upload.single('avatar'), UserController.updateAvatar);
userRouter.delete('/me/avatar', authenticate, UserController.deleteAvatar);
