import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { upload } from '../middlewares/upload.middleware';
export const userRouter = Router();

userRouter.get('/me', authenticate, UserController.getMe);
<<<<<<< HEAD
userRouter.post('/me/change-password', authenticate, UserController.changePassword);
=======
>>>>>>> ba8db72789a1b6c442bcd55d3869e6465139c9a4
userRouter.patch('/me/complete-coach', authenticate, UserController.completeCoach);
userRouter.put('/me', authenticate, UserController.updateMe);
userRouter.get('/me/certificates', authenticate, UserController.getMyCertificates);
userRouter.get('/me/certificates/:id/pdf', authenticate, UserController.streamCertificatePdf);
userRouter.get('/me/certificates/:id', authenticate, UserController.getCertificateById);
userRouter.post('/me/certificates/:courseId/retry', authenticate, UserController.retryCertificate);
userRouter.get('/', authenticate, requireRole('ADMIN'), UserController.getAll);
userRouter.post('/', authenticate, requireRole('ADMIN'), UserController.createUser);
userRouter.get('/:id/overview', authenticate, requireRole('ADMIN'), UserController.getStudentOverview);
<<<<<<< HEAD
userRouter.get('/:id/eligible-courses', authenticate, requireRole('ADMIN'), UserController.getEligibleCourses);
=======
>>>>>>> ba8db72789a1b6c442bcd55d3869e6465139c9a4
userRouter.put('/:id/courses', authenticate, requireRole('ADMIN'), UserController.assignCourses);
userRouter.delete('/:id/enrollments/:courseId', authenticate, requireRole('ADMIN'), UserController.removeStudentCourseAccess);
userRouter.put('/:id', authenticate, requireRole('ADMIN'), UserController.updateUser);
userRouter.post('/:id/reset-password', authenticate, requireRole('ADMIN'), UserController.resetPassword);
userRouter.delete('/:id', authenticate, requireRole('ADMIN'), UserController.deleteUser);
userRouter.delete('/:userId/certificates/:courseId', authenticate, requireRole('ADMIN'), UserController.revokecertificate);
userRouter.put('/me/avatar',authenticate,upload.single('avatar'),UserController.updateAvatar);

userRouter.delete('/me/avatar',authenticate,UserController.deleteAvatar);