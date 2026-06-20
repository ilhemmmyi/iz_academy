import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ReportService } from '../services/report.service';

export const ReportController = {

  async create(req: AuthRequest, res: Response) {
    try {
      const { reason, messageId, commentId } = req.body;

      if (!reason?.trim()) {
        return res.status(400).json({ message: 'Le motif est requis' });
      }
      if (!messageId && !commentId) {
        return res.status(400).json({ message: 'messageId ou commentId est requis' });
      }
      if (messageId && commentId) {
        return res.status(400).json({ message: 'Fournissez uniquement messageId ou commentId, pas les deux' });
      }

      const report = await ReportService.create(
        req.user!.userId,
        reason,
        messageId,
        commentId,
      );
      res.status(201).json(report);
    } catch (err: any) {
      if (err.message === 'ALREADY_REPORTED') {
        return res.status(409).json({ message: 'Vous avez déjà signalé ce contenu' });
      }
      res.status(500).json({ message: 'Échec de la création du signalement' });
    }
  },

  async getAll(_req: AuthRequest, res: Response) {
    try {
      const reports = await ReportService.getAll();
      res.json(reports);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des signalements' });
    }
  },

  async markReviewed(req: AuthRequest, res: Response) {
    try {
      const report = await ReportService.markReviewed(String(req.params.id));
      res.json(report);
    } catch {
      res.status(500).json({ message: 'Échec de la mise à jour du signalement' });
    }
  },
};
