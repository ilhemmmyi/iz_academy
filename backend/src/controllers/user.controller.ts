import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';
import { prisma } from '../config/prisma';
import { AuditService, AuditAction, extractRequestContext } from '../services/audit.service';

export const UserController = {

  async getMe(req: AuthRequest, res: Response) {
    try {
      res.json(await UserService.getMe(req.user!.userId));
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      res.status(500).json({ message: 'Échec de la récupération du profil' });
    }
  },

  async completeCoach(req: AuthRequest, res: Response) {
    try {
      res.json(await UserService.completeCoach(req.user!.userId));
    } catch {
      res.status(500).json({ message: 'Échec de la finalisation du parcours coach' });
    }
  },

  async updateMe(req: AuthRequest, res: Response) {
    try {
      const { name, avatarUrl, phone, address, educationLevel, studentStatus } = req.body;
      if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== '') {
        try {
          const url = new URL(avatarUrl);
          if (!['http:', 'https:'].includes(url.protocol)) {
            return res.status(400).json({ message: 'URL d\'avatar invalide' });
          }
        } catch {
          return res.status(400).json({ message: 'URL d\'avatar invalide' });
        }
      }
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 3 || name.length > 100) {
          return res.status(400).json({ message: 'Le nom doit contenir entre 3 et 100 caractères' });
        }
        if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(name.trim())) {
          return res.status(400).json({ message: 'Le nom ne doit contenir que des lettres' });
        }
      }
      if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 30)) {
        return res.status(400).json({ message: 'Numéro de téléphone invalide' });
      }
      if (address !== undefined && address !== null && (typeof address !== 'string' || address.length > 200)) {
        return res.status(400).json({ message: 'Adresse invalide' });
      }
      if (educationLevel !== undefined && educationLevel !== null && (typeof educationLevel !== 'string' || educationLevel.length > 50)) {
        return res.status(400).json({ message: 'Niveau scolaire invalide' });
      }
      if (studentStatus !== undefined && studentStatus !== null && (typeof studentStatus !== 'string' || studentStatus.length > 50)) {
        return res.status(400).json({ message: 'Statut invalide' });
      }
      res.json(await UserService.updateMe(req.user!.userId, { name: name !== undefined ? name.trim() : name, avatarUrl, phone, address, educationLevel, studentStatus }));
    } catch {
      res.status(500).json({ message: 'Échec de la mise à jour du profil' });
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(Math.max(1, Number(req.query.limit) || 25), 100);
      res.json(await UserService.getAll({ search, role, page, limit }));
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des utilisateurs' });
    }
  },

  async updateAvatar(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier téléchargé' });
      }
      const user = await UserService.updateAvatar(req.user!.userId, req.file);
      res.json(user);
    } catch {
      res.status(500).json({ message: 'Échec du téléchargement de l\'avatar' });
    }
  },

  async deleteAvatar(req: AuthRequest, res: Response) {
    try {
      const user = await UserService.deleteAvatar(req.user!.userId);
      res.json(user);
    } catch {
      res.status(500).json({ message: 'Échec de la suppression de l\'avatar' });
    }
  },

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      if (req.params.id === req.user!.userId) {
        return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
      }
      await UserService.deleteUser(String(req.params.id), req.user!.userId);
      AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.USER_DELETE, targetType: 'User', targetId: String(req.params.id), ...extractRequestContext(req) });
      res.json({ message: 'User deleted' });
    } catch (err: any) {
      res.status(500).json({ message: 'Échec de la suppression de l\'utilisateur' });
    }
  },

  async createUser(req: AuthRequest, res: Response) {
    try {
      const { name, email, role, formation, duree, dateDebut, password } = req.body;
      if (!name || !email || !role || !password) {
        return res.status(400).json({ message: 'Le nom, l\'email, le rôle et le mot de passe sont requis' });
      }
      const normalizedRole = (role as string).toUpperCase() as 'STUDENT' | 'TEACHER';
      if (!['STUDENT', 'TEACHER'].includes(normalizedRole)) {
        return res.status(400).json({ message: 'Rôle invalide' });
      }
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
      }
      const user = await UserService.createUser({ name, email, role: normalizedRole, formation, duree, dateDebut, password });
      AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.USER_CREATE, targetType: 'User', targetId: user.id, payload: { email: user.email, role: user.role }, ...extractRequestContext(req) });
      res.status(201).json(user);
    } catch (err: any) {
      if (err.code === 'CONFLICT') return res.status(409).json({ message: 'Cet email est déjà utilisé' });
      res.status(500).json({ message: 'Échec de la création de l\'utilisateur' });
    }
  },

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (typeof newPassword !== 'string' || !newPassword) {
        return res.status(400).json({ message: 'Le nouveau mot de passe est requis' });
      }
      const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!strongPassword.test(newPassword)) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' });
      }
      // Reject same-as-current explicitly (only when currentPassword was supplied)
      if (currentPassword && currentPassword === newPassword) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent de l\'ancien.' });
      }
      await UserService.changePassword(
        req.user!.userId,
        newPassword,
        typeof currentPassword === 'string' && currentPassword.length > 0 ? currentPassword : undefined,
      );
      AuditService.auth({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.AUTH_PASSWORD_CHANGE, targetType: 'User', targetId: req.user!.userId, ...extractRequestContext(req) });
      res.json({ message: 'Password changed successfully' });
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Utilisateur introuvable.' });
      if (err.code === 'WRONG_PASSWORD') return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
      if (err.code === 'CURRENT_PASSWORD_REQUIRED') return res.status(400).json({ message: 'Le mot de passe actuel est requis.' });
      if (err.code === 'SAME_PASSWORD') return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent de l\'ancien.' });
      res.status(500).json({ message: 'Erreur lors du changement de mot de passe.' });
    }
  },

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { role, formation, duree, dateDebut, name, email } = req.body;

      const targetUser = await prisma.user.findUnique({
        where: { id: String(req.params.id) },
        select: { role: true },
      });
      if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

      const data: Record<string, unknown> = {};

      if (targetUser.role === 'STUDENT') {
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
      } else {
        if (role !== undefined) {
          const validRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
          if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide' });
          }
          data.role = role;
        }
        if (formation !== undefined) data.formation = formation;
        if (duree !== undefined) data.duree = duree;
        if (dateDebut !== undefined && dateDebut !== '') data.dateDebut = dateDebut;
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
      }

      const updated = await UserService.updateUser(String(req.params.id), data);
      if (data.role !== undefined && data.role !== targetUser.role) {
        AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.USER_ROLE_CHANGE, targetType: 'User', targetId: String(req.params.id), payload: { oldRole: targetUser.role, newRole: data.role }, ...extractRequestContext(req) });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('[updateUser] error:', err?.message, err?.meta);
      res.status(500).json({ message: 'Échec de la mise à jour de l\'utilisateur' });
    }
  },

  async resetPassword(req: AuthRequest, res: Response) {
    try {
      const result = await UserService.resetPassword(String(req.params.id));
      AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.USER_PASSWORD_RESET_ADMIN, targetType: 'User', targetId: String(req.params.id), ...extractRequestContext(req) });
      res.json(result);
    } catch {
      res.status(500).json({ message: 'Échec de la réinitialisation du mot de passe' });
    }
  },

  async getMyCertificates(req: AuthRequest, res: Response) {
    try {
      res.json(await UserService.getMyCertificates(req.user!.userId));
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des certificats' });
    }
  },

  async getCertificateById(req: AuthRequest, res: Response) {
    try {
      const cert = await UserService.getCertificateById(String(req.params.id), req.user!.userId);
      res.json(cert);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Certificat introuvable' });
      res.status(500).json({ message: 'Échec de la récupération du certificat' });
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
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Certificat introuvable' });
      console.error('[streamCertificatePdf]', err);
      res.status(500).json({ message: 'Échec de la génération du PDF' });
    }
  },

  async retryCertificate(req: AuthRequest, res: Response) {
    try {
      await UserService.retryCertificate(req.user!.userId, String(req.params.courseId));
      res.json({ message: 'Certificate generation queued' });
    } catch (err: any) {
      if (err.code === 'FORBIDDEN') return res.status(403).json({ message: 'Aucun projet validé pour ce cours' });
      res.status(500).json({ message: 'Échec de la mise en file d\'attente du certificat' });
    }
  },

  async getEligibleCourses(req: AuthRequest, res: Response) {
    try {
      const courses = await UserService.getEligibleCourses(req.user!.userId, String(req.params.id));
      res.json(courses);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des cours éligibles' });
    }
  },

  async assignCourses(req: AuthRequest, res: Response) {
    try {
      const { courseIds } = req.body as { courseIds: string[] };
      if (!Array.isArray(courseIds)) {
        return res.status(400).json({ message: 'courseIds doit être un tableau' });
      }
      await UserService.assignCourses(req.user!.userId, String(req.params.id), courseIds);
      AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.USER_ASSIGN_COURSES, targetType: 'User', targetId: String(req.params.id), payload: { courseIds }, ...extractRequestContext(req) });
      res.json({ message: 'Courses assigned successfully' });
    } catch (err: any) {
      console.error('[assignCourses] error:', err?.message, err?.meta);
      if (err.code === 'CONFLICT') return res.status(409).json({ message: err.message });
      res.status(500).json({ message: 'Échec de l\'attribution des cours' });
    }
  },

  async getStudentOverview(req: AuthRequest, res: Response) {
    try {
      const data = await UserService.getStudentOverview(String(req.params.id));
      res.json(data);
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: err.message });
      res.status(500).json({ message: 'Échec de la récupération de l\'aperçu de l\'étudiant' });
    }
  },

  async revokecertificate(req: AuthRequest, res: Response) {
    try {
      const userId = String(req.params.userId);
      const courseId = String(req.params.courseId);
      await prisma.certificate.deleteMany({ where: { userId, courseId } });
      AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.CERTIFICATE_REVOKE, targetType: 'Certificate', payload: { userId, courseId }, ...extractRequestContext(req) });
      res.json({ message: 'Certificate revoked' });
    } catch {
      res.status(500).json({ message: 'Échec de la révocation du certificat' });
    }
  },

  async removeStudentCourseAccess(req: AuthRequest, res: Response) {
    try {
      const studentId = String(req.params.id);
      const courseId = String(req.params.courseId);
      await UserService.removeStudentCourseAccess(studentId, courseId);
      AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.USER_REMOVE_COURSE_ACCESS, targetType: 'User', targetId: studentId, payload: { courseId }, ...extractRequestContext(req) });
      res.json({ message: 'Course access removed' });
    } catch {
      res.status(500).json({ message: 'Échec de la suppression de l\'accès au cours' });
    }
  },
};
