import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LessonResourceService } from '../services/lessonResource.service';

export const LessonResourceController = {

  async getResources(req: AuthRequest, res: Response) {
    try {
      const resources = await LessonResourceService.getByLesson(String(req.params.lessonId), req.user!.userId, req.user!.role);
      res.json(resources);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé' });
      res.status(500).json({ message: 'Échec de la récupération des ressources de la leçon' });
    }
  },

  async createFileResource(req: AuthRequest, res: Response) {
    try {
      const { title } = req.body;
      if (!title?.trim()) return res.status(400).json({ message: 'Le titre est requis' });
      if (!req.file) return res.status(400).json({ message: 'Le fichier est requis' });
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
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé' });
      res.status(500).json({ message: 'Échec de la création de la ressource' });
    }
  },

  async createLinkResource(req: AuthRequest, res: Response) {
    try {
      const { title, url } = req.body;
      if (!title?.trim()) return res.status(400).json({ message: 'Le titre est requis' });
      if (!url?.trim()) return res.status(400).json({ message: 'L\'URL est requise' });
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
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé' });
      res.status(500).json({ message: 'Échec de la création de la ressource' });
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
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé' });
      res.status(500).json({ message: 'Échec de la suppression de la ressource' });
    }
  },
};
