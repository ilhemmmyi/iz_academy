import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ProjectService } from '../services/project.service';
import { AuditService, AuditAction, extractRequestContext } from '../services/audit.service';

export const ProjectController = {

  async submit(req: AuthRequest, res: Response) {
    const projectId = String(req.params.projectId);
    try {
      const { githubUrl, comment } = req.body;
      if (!githubUrl?.trim()) return res.status(400).json({ message: 'L\'URL GitHub est requise' });
      const submission = await ProjectService.submit(req.user!.userId, projectId, githubUrl, comment);
      AuditService.log({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.PROJECT_SUBMIT, targetType: 'Project', targetId: projectId, ...extractRequestContext(req) });
      res.status(201).json(submission);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'ALREADY_SUBMITTED') return res.status(409).json({ message: err.message });
      if (err.code === 'FORBIDDEN') {
        AuditService.security({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.PROJECT_SUBMIT_FORBIDDEN, targetType: 'Project', targetId: projectId, payload: { reason: err.message }, ...extractRequestContext(req) });
        return res.status(403).json({ message: 'Accès refusé' });
      }
      res.status(500).json({ message: 'Échec de la soumission du projet' });
    }
  },

  async mySubmissions(req: AuthRequest, res: Response) {
    try {
      const submissions = await ProjectService.mySubmissions(req.user!.userId);
      res.json(submissions);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des soumissions' });
    }
  },

  async teacherSubmissions(req: AuthRequest, res: Response) {
    try {
      const submissions = await ProjectService.teacherSubmissions(req.user!.userId);
      res.json(submissions);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des soumissions des enseignants' });
    }
  },

  async review(req: AuthRequest, res: Response) {
    try {
      const { status, feedback } = req.body;
      if (!['VALIDATED', 'NEEDS_IMPROVEMENT'].includes(status)) {
        return res.status(400).json({ message: 'Le statut doit être VALIDATED ou NEEDS_IMPROVEMENT' });
      }
      const submission = await ProjectService.review(
        String(req.params.submissionId),
        status,
        feedback,
        req.user!.userId,
        req.user!.role,
      );
      AuditService.log({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.PROJECT_REVIEW, targetType: 'ProjectSubmission', targetId: String(req.params.submissionId), payload: { status, feedback: typeof feedback === 'string' ? feedback.slice(0, 200) : undefined }, ...extractRequestContext(req) });
      res.json(submission);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Soumission introuvable' });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé : ce cours ne vous appartient pas' });
      res.status(500).json({ message: 'Échec de l\'évaluation de la soumission' });
    }
  },

  async deleteSubmission(req: AuthRequest, res: Response) {
    try {
      await ProjectService.deleteSubmission(req.user!.userId, String(req.params.submissionId));
      res.status(204).send();
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Soumission introuvable' });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Accès refusé' });
      res.status(500).json({ message: 'Échec de la suppression de la soumission' });
    }
  },

  /** Admin: list all teacher-validated submissions waiting for final approval */
  async listValidatedPendingApproval(_req: AuthRequest, res: Response) {
    try {
      const submissions = await ProjectService.listValidatedPendingApproval();
      res.json(submissions);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des soumissions en attente' });
    }
  },

};
