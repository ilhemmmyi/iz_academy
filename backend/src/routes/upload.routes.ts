import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { uploadVideo, uploadImage } from '../middlewares/upload.middleware';

export const uploadRouter = Router();

uploadRouter.post('/video', authenticate, requireRole('ADMIN', 'TEACHER'), uploadVideo, UploadController.uploadVideo);
uploadRouter.post('/thumbnail', authenticate, requireRole('ADMIN'), uploadImage, UploadController.uploadThumbnail);
