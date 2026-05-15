import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LessonResourceService } from '../services/lessonResource.service';

export const LessonResourceController = {

  async getResources(req: AuthRequest, res: Response) {
    try {
      const resources = await LessonResourceService.getByLesson(String(req.params.lessonId));
      res.json(resources);
    } catch {
      res.status(500).json({ message: 'Failed to fetch lesson resources' });
    }
  },

  async createFileResource(req: AuthRequest, res: Response) {
    try {
      const { title } = req.body;
      if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
      if (!req.file) return res.status(400).json({ message: 'File is required' });
      const resource = await LessonResourceService.createFile(
        String(req.params.lessonId),
        req.user!.userId,
        req.user!.role,
        title,
        req.file,
      );
      res.status(201).json(resource);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden' });
      res.status(500).json({ message: 'Failed to create lesson resource' });
    }
  },

  async createLinkResource(req: AuthRequest, res: Response) {
    try {
      const { title, url } = req.body;
      if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
      if (!url?.trim()) return res.status(400).json({ message: 'URL is required' });
      const resource = await LessonResourceService.createLink(
        String(req.params.lessonId),
        req.user!.userId,
        req.user!.role,
        title,
        url,
      );
      res.status(201).json(resource);
    } catch (err: any) {
      if (err.code === 'VALIDATION') return res.status(400).json({ message: err.message });
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden' });
      res.status(500).json({ message: 'Failed to create lesson resource' });
    }
  },

  async deleteResource(req: AuthRequest, res: Response) {
    try {
      await LessonResourceService.delete(
        String(req.params.id),
        req.user!.userId,
        req.user!.role,
      );
      res.json({ message: 'Resource deleted' });
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden' });
      res.status(500).json({ message: 'Failed to delete lesson resource' });
    }
  },
};
