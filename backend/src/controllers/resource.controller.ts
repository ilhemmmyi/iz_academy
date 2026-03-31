import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ResourceService } from '../services/resource.service';

export const ResourceController = {

  async getResources(req: AuthRequest, res: Response) {
    try {
      const resources = await ResourceService.getByCourse(String(req.params.courseId));
      res.json(resources);
    } catch {
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  },

  async createResource(req: AuthRequest, res: Response) {
    try {
      const { title } = req.body;
      if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
      if (!req.file) return res.status(400).json({ message: 'File is required' });
      const resource = await ResourceService.create(String(req.params.courseId), req.user!.userId, title, req.file);
      res.status(201).json(resource);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden' });
      res.status(500).json({ message: 'Failed to create resource' });
    }
  },

  async deleteResource(req: AuthRequest, res: Response) {
    try {
      await ResourceService.delete(String(req.params.id), req.user!.userId);
      res.json({ message: 'Resource deleted' });
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Resource not found' });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden' });
      res.status(500).json({ message: 'Failed to delete resource' });
    }
  },
};
