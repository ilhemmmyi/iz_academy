import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ProjectService } from '../services/project.service';
import { AuditService, AuditAction, extractRequestContext } from '../services/audit.service';

export const ProjectController = {

  async submit(req: AuthRequest, res: Response) {
    const projectId = String(req.params.projectId);
    try {
      const { githubUrl, comment } = req.body;
      if (!githubUrl?.trim()) return res.status(400).json({ message: 'githubUrl is required' });
      const submission = await ProjectService.submit(req.user!.userId, projectId, githubUrl, comment);
      AuditService.log({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.PROJECT_SUBMIT, targetType: 'Project', targetId: projectId, ...extractRequestContext(req) });
      res.status(201).json(submission);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'ALREADY_SUBMITTED') return res.status(409).json({ message: err.message });
      if (err.code === 'FORBIDDEN') {
        AuditService.security({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.PROJECT_SUBMIT_FORBIDDEN, targetType: 'Project', targetId: projectId, payload: { reason: err.message }, ...extractRequestContext(req) });
        return res.status(403).json({ message: 'Forbidden' });
      }
      res.status(500).json({ message: 'Failed to submit project' });
    }
  },

  async mySubmissions(req: AuthRequest, res: Response) {
    try {
      const submissions = await ProjectService.mySubmissions(req.user!.userId);
      res.json(submissions);
    } catch {
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  },

  async teacherSubmissions(req: AuthRequest, res: Response) {
    try {
      const submissions = await ProjectService.teacherSubmissions(req.user!.userId);
      res.json(submissions);
    } catch {
      res.status(500).json({ message: 'Failed to fetch teacher submissions' });
    }
  },

  async review(req: AuthRequest, res: Response) {
    try {
      const { status, feedback } = req.body;
      if (!['VALIDATED', 'NEEDS_IMPROVEMENT'].includes(status)) {
        return res.status(400).json({ message: 'status must be VALIDATED or NEEDS_IMPROVEMENT' });
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
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Submission not found' });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden: not your course' });
      res.status(500).json({ message: 'Failed to review submission' });
    }
  },

  async deleteSubmission(req: AuthRequest, res: Response) {
    try {
      await ProjectService.deleteSubmission(req.user!.userId, String(req.params.submissionId));
      res.status(204).send();
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Submission not found' });
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden' });
      res.status(500).json({ message: 'Failed to delete submission' });
    }
  },

  /** Admin: list all teacher-validated submissions waiting for final approval */
  async listValidatedPendingApproval(_req: AuthRequest, res: Response) {
    try {
      const submissions = await ProjectService.listValidatedPendingApproval();
      res.json(submissions);
    } catch {
      res.status(500).json({ message: 'Failed to fetch pending submissions' });
    }
  },

};
