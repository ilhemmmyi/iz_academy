import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';
import { prisma } from '../config/prisma';

export const UserController = {

  async getMe(req: AuthRequest, res: Response) {
    try {
      res.json(await UserService.getMe(req.user!.userId));
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  },

  async completeCoach(req: AuthRequest, res: Response) {
    try {
      res.json(await UserService.completeCoach(req.user!.userId));
    } catch {
      res.status(500).json({ message: 'Failed to complete coach' });
    }
  },

  async updateMe(req: AuthRequest, res: Response) {
    try {
      const { name, avatarUrl } = req.body;
      // Validate avatarUrl is a proper HTTPS URL if provided
      if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== '') {
        try {
          const url = new URL(avatarUrl);
          if (!['http:', 'https:'].includes(url.protocol)) {
            return res.status(400).json({ message: 'Invalid avatar URL' });
          }
        } catch {
          return res.status(400).json({ message: 'Invalid avatar URL' });
        }
      }
      if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.length > 100)) {
        return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
      }
      res.json(await UserService.updateMe(req.user!.userId, { name, avatarUrl }));
    } catch {
      res.status(500).json({ message: 'Failed to update profile' });
    }
  },

  async getAll(_req: AuthRequest, res: Response) {
    try {
      res.json(await UserService.getAll());
    } catch {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  },

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      if (req.params.id === req.user!.userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      await UserService.deleteUser(String(req.params.id), req.user!.userId);
      res.json({ message: 'User deleted' });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  },

  async createUser(req: AuthRequest, res: Response) {
    try {
      const { name, email, role, formation, duree, dateDebut } = req.body;
      if (!name || !email || !role) {
        return res.status(400).json({ message: 'name, email and role are required' });
      }
      const normalizedRole = (role as string).toUpperCase() as 'STUDENT' | 'TEACHER';
      if (!['STUDENT', 'TEACHER'].includes(normalizedRole)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      const user = await UserService.createUser({ name, email, role: normalizedRole, formation, duree, dateDebut });
      res.status(201).json(user);
    } catch (err: any) {
      if (err.code === 'CONFLICT') return res.status(409).json({ message: 'Email already in use' });
      res.status(500).json({ message: 'Failed to create user' });
    }
  },

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { role, isActive, formation, duree, dateDebut, name, email } = req.body;

      // Determine the target user's role to enforce student-specific restrictions
      const targetUser = await prisma.user.findUnique({
        where: { id: String(req.params.id) },
        select: { role: true },
      });
      if (!targetUser) return res.status(404).json({ message: 'User not found' });

      const data: Record<string, unknown> = {};

      if (targetUser.role === 'STUDENT') {
        // For students, only name and email may be changed
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
      } else {
        if (role !== undefined) {
          const validRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
          if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
          }
          data.role = role;
        }
        if (isActive !== undefined) data.isActive = Boolean(isActive);
        if (formation !== undefined) data.formation = formation;
        if (duree !== undefined) data.duree = duree;
        if (dateDebut !== undefined) data.dateDebut = dateDebut;
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
      }

      res.json(await UserService.updateUser(String(req.params.id), data));
    } catch {
      res.status(500).json({ message: 'Failed to update user' });
    }
  },

  async resetPassword(req: AuthRequest, res: Response) {
    try {
      const result = await UserService.resetPassword(String(req.params.id));
      res.json(result);
    } catch {
      res.status(500).json({ message: 'Failed to reset password' });
    }
  },

  async getMyCertificates(req: AuthRequest, res: Response) {
    try {
      res.json(await UserService.getMyCertificates(req.user!.userId));
    } catch {
      res.status(500).json({ message: 'Failed to fetch certificates' });
    }
  },

  async getCertificateById(req: AuthRequest, res: Response) {
    try {
      const cert = await UserService.getCertificateById(String(req.params.id), req.user!.userId);
      res.json(cert);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Certificate not found' });
      res.status(500).json({ message: 'Failed to fetch certificate' });
    }
  },

  async streamCertificatePdf(req: AuthRequest, res: Response) {
    try {
      const { pdfBuffer, certId } = await UserService.buildCertificatePdfBuffer(
        String(req.params.id),
        req.user!.userId,
      );
      const shortId = certId.slice(-14).toUpperCase();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificat-${shortId}.pdf"`);
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.setHeader('Cache-Control', 'private, no-cache');
      res.send(pdfBuffer);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Certificate not found' });
      console.error('[streamCertificatePdf]', err);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  },

  async retryCertificate(req: AuthRequest, res: Response) {
    try {
      await UserService.retryCertificate(req.user!.userId, String(req.params.courseId));
      res.json({ message: 'Certificate generation queued' });
    } catch (err: any) {
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'No validated project for this course' });
      res.status(500).json({ message: 'Failed to queue certificate' });
    }
  },

  async assignCourses(req: AuthRequest, res: Response) {
    try {
      const { courseIds } = req.body as { courseIds: string[] };
      if (!Array.isArray(courseIds)) {
        return res.status(400).json({ message: 'courseIds must be an array' });
      }
      await UserService.assignCourses(String(req.params.id), courseIds);
      res.json({ message: 'Courses assigned successfully' });
    } catch {
      res.status(500).json({ message: 'Failed to assign courses' });
    }
  },

  async getStudentOverview(req: AuthRequest, res: Response) {
    try {
      const data = await UserService.getStudentOverview(String(req.params.id));
      res.json(data);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      res.status(500).json({ message: 'Failed to fetch student overview' });
    }
  },

  async revokecertificate(req: AuthRequest, res: Response) {
    try {
      const userId = String(req.params.userId);
      const courseId = String(req.params.courseId);
      await prisma.certificate.deleteMany({ where: { userId, courseId } });
      res.json({ message: 'Certificate revoked' });
    } catch {
      res.status(500).json({ message: 'Failed to revoke certificate' });
    }
  },

  async removeStudentCourseAccess(req: AuthRequest, res: Response) {
    try {
      const studentId = String(req.params.id);
      const courseId = String(req.params.courseId);
      await UserService.removeStudentCourseAccess(studentId, courseId);
      res.json({ message: 'Course access removed' });
    } catch {
      res.status(500).json({ message: 'Failed to remove course access' });
    }
  },
};


