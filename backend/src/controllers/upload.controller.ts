import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UploadService } from '../services/upload.service';
import { prisma } from '../config/prisma';

export const UploadController = {
  async uploadVideo(req: AuthRequest, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const url = await UploadService.uploadVideo(req.file.buffer, req.file.mimetype);
      res.json({ url });
    } catch {
      res.status(500).json({ message: 'Upload failed' });
    }
  },

  async uploadThumbnail(req: AuthRequest, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const url = await UploadService.uploadThumbnail(req.file.buffer, req.file.mimetype);
      res.json({ url });
    } catch {
      res.status(500).json({ message: 'Upload failed' });
    }
  },

  async uploadHomepageVideo(req: AuthRequest, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const url = await UploadService.uploadVideo(req.file.buffer, req.file.mimetype);
      await prisma.siteSetting.upsert({
        where: { key: 'homepageVideoUrl' },
        update: { value: url },
        create: { key: 'homepageVideoUrl', value: url },
      });
      res.json({ url });
    } catch {
      res.status(500).json({ message: 'Upload failed' });
    }
  },
};
