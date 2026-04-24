import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ProjectService } from '../services/project.service';

export const ProjectController = {

  async submit(req: AuthRequest, res: Response) {
    try {
      const { githubUrl, comment } = req.body;
      if (!githubUrl?.trim()) return res.status(400).json({ message: 'githubUrl is required' });
      const submission = await ProjectService.submit(
        req.user!.userId,
        String(req.params.projectId),
        githubUrl,
        comment,
      );
      res.status(201).json(submission);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'LESSONS_INCOMPLETE') return res.status(403).json({ message: 'Vous devez completer toutes les lecons avant de soumettre un projet.' });
      if (err.code === 'ALREADY_SUBMITTED') return res.status(409).json({ message: err.message });
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
      const submission = await ProjectService.review(String(req.params.submissionId), status, feedback);
      res.json(submission);
    } catch {
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

  /**
   * Admin: give final authorization for certificate generation.
   * Triggers the certificate queue only when all 4 conditions are confirmed.
   */
  async adminApprove(req: AuthRequest, res: Response) {
    try {
      const submission = await ProjectService.adminApprove(
        String(req.params.submissionId),
        req.user!.userId,
      );
      res.json({ message: 'Certificate approved and queued for generation', submission });
    } catch (err: any) {
      if (err.code === 'NOT_FOUND_OR_NOT_VALIDATED') {
        return res.status(404).json({ message: err.message });
      }
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      if (err.code === 'LESSONS_INCOMPLETE') {
        return res.status(403).json({ message: 'Student has not completed all lessons yet' });
      }
      res.status(500).json({ message: 'Failed to approve certificate' });
    }
  },
};
