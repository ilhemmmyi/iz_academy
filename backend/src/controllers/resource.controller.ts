import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ResourceService } from '../services/resource.service';

export const ResourceController = {

  async getResources(req: AuthRequest, res: Response) {
    try {
      const resources = await ResourceService.getByCourse(String(req.params.courseId), req.user!.userId, req.user!.role);
      res.json(resources);
    } catch (err: any) {
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé' });
      res.status(500).json({ message: 'Échec de la récupération des ressources' });
    }
  },

  async createResource(req: AuthRequest, res: Response) {
    try {
      const { title } = req.body;
      if (!title?.trim()) return res.status(400).json({ message: 'Le titre est requis' });
      if (!req.file) return res.status(400).json({ message: 'Le fichier est requis' });
      const resource = await ResourceService.create(String(req.params.courseId), req.user!.userId, title, req.file);
      res.status(201).json(resource);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé' });
      res.status(400).json({ message: 'Échec de la création de la ressource' });
    }
  },

  async deleteResource(req: AuthRequest, res: Response) {
    try {
      await ResourceService.delete(String(req.params.id), req.user!.userId, req.user!.role);
      res.json({ message: 'Resource deleted' });
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Ressource introuvable' });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé' });
      res.status(400).json({ message: 'Échec de la suppression de la ressource' });
    }
  },
};
