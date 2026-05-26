import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { uploadVideo, uploadImage } from '../middlewares/upload.middleware';
import { uploadLimiter } from '../middlewares/rate-limit.middleware';

export const uploadRouter = Router();

uploadRouter.post('/video', authenticate, requireRole('ADMIN', 'TEACHER'), uploadLimiter, uploadVideo, UploadController.uploadVideo);
uploadRouter.post('/thumbnail', authenticate, requireRole('ADMIN'), uploadLimiter, uploadImage, UploadController.uploadThumbnail);
uploadRouter.post('/homepage-video', authenticate, requireRole('ADMIN'), uploadLimiter, uploadVideo, UploadController.uploadHomepageVideo);
