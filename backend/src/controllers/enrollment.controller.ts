import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { EnrollmentService } from '../services/enrollment.service';

export const EnrollmentController = {

  async request(req: AuthRequest, res: Response) {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Seuls les étudiants peuvent s\'inscrire' });
    }
    try {
      const { courseId, message, phone, address, educationLevel, studentStatus } = req.body;
      const extraInfo = { phone, address, educationLevel, studentStatus };
      const enrollment = await EnrollmentService.request(req.user!.userId, courseId, message, extraInfo);
      res.status(201).json(enrollment);
    } catch (err: any) {
      if (err.message === 'ALREADY_ENROLLED') return res.status(409).json({ message: 'Already enrolled' });
      res.status(500).json({ message: 'Enrollment request failed' });
    }
  },

  async getAll(_req: AuthRequest, res: Response) {
    try {
      const enrollments = await EnrollmentService.getAll();
      res.json(enrollments);
    } catch {
      res.status(500).json({ message: 'Failed to fetch enrollments' });
    }
  },

  async getMyEnrollments(req: AuthRequest, res: Response) {
    try {
      const enrollments = await EnrollmentService.getByUser(req.user!.userId);
      res.json(enrollments);
    } catch {
      res.status(500).json({ message: 'Failed to fetch enrollments' });
    }
  },

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.body;
      const enrollment = await EnrollmentService.updateStatus(String(req.params.id), status);
      res.json(enrollment);
    } catch {
      res.status(500).json({ message: 'Failed to update enrollment status' });
    }
  },

  async getTeacherStudents(req: AuthRequest, res: Response) {
    try {
      const data = await EnrollmentService.getTeacherStudents(req.user!.userId);
      res.json(data);
    } catch {
      res.status(500).json({ message: 'Failed to fetch teacher students' });
    }
  },

  async deleteEnrollment(req: AuthRequest, res: Response) {
    try {
      await EnrollmentService.delete(String(req.params.id));
      res.status(204).send();
    } catch {
      res.status(500).json({ message: 'Failed to delete enrollment' });
    }
  },

  async getWatchStats(req: AuthRequest, res: Response) {
    try {
      const data = await EnrollmentService.getWatchStats(req.user!.userId);
      res.json(data);
    } catch {
      res.status(500).json({ message: 'Failed to fetch watch stats' });
    }
  },
};
