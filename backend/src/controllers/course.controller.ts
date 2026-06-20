import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { CategoryService } from '../services/category.service';
import { CourseSnapshotService } from '../services/courseSnapshot.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';
import { ProjectModel } from '../models/project.model';
import { queueEmail } from '../utils/queueEmail';
import { config } from '../config';
import { AuditService, AuditAction, extractRequestContext } from '../services/audit.service';

export const CourseController = {

  async getCategories(_req: Request, res: Response) {
    try {
      const categories = await CategoryService.getAll();
      res.json(categories);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des catégories' });
    }
  },

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ message: 'Le nom est requis' });
      const category = await CategoryService.create(name);
      res.status(201).json(category);
    } catch (err: any) {
      if (err.code === 'P2002') return res.status(409).json({ message: 'Cette catégorie existe déjà' });
      res.status(500).json({ message: 'Échec de la création de la catégorie' });
    }
  },

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ message: 'Le nom est requis' });
      const category = await CategoryService.update(String(req.params.id), name);
      res.json(category);
    } catch (err: any) {
      if (err.code === 'P2025') return res.status(404).json({ message: 'Catégorie introuvable' });
      if (err.code === 'P2002') return res.status(409).json({ message: 'Cette catégorie existe déjà' });
      res.status(500).json({ message: 'Échec de la mise à jour de la catégorie' });
    }
  },

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      await CategoryService.delete(String(req.params.id));
      res.json({ message: 'Category deleted' });
    } catch (err: any) {
      if (err.code === 'P2025') return res.status(404).json({ message: 'Catégorie introuvable' });
      if (err.code === 'P2003') return res.status(409).json({ message: 'Impossible de supprimer : cette catégorie est utilisée par des cours' });
      res.status(500).json({ message: 'Échec de la suppression de la catégorie' });
    }
  },

  async getAllAdmin(_req: AuthRequest, res: Response) {
    try {
      const courses = await CourseService.getAllAdmin();
      res.json(courses);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des cours' });
    }
  },

  async getMyCourses(req: AuthRequest, res: Response) {
    try {
      const courses = await CourseService.getMine(req.user!.userId);
      res.json(courses);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des cours' });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const { category, level, search } = req.query;
      const filters: any = {};
      if (category) filters.category = { slug: String(category) };
      if (level) filters.level = String(level);
      if (search) filters.title = { contains: String(search), mode: 'insensitive' };
      const courses = await CourseService.getAll(filters);
      res.json(courses);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des cours' });
    }
  },

  /**
   * Version-aware course detail endpoint.
   * - Teachers / Admins: always see live content.
   * - Enrolled students whose enrolledContentVersion < course.contentVersion: served from snapshot.
   * - Everyone else: live content.
   */
  async getById(req: Request, res: Response) {
    try {
      const courseId = String(req.params.id);
      const userId = (req as AuthRequest).user?.userId;
      const userRole = (req as AuthRequest).user?.role;

      // Teachers and admins always see the latest live content.
      const isStaff = userRole === 'ADMIN' || userRole === 'TEACHER';

      if (userId && !isStaff) {
        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId } },
          select: { status: true, enrolledContentVersion: true },
        });

        if (enrollment?.status === 'APPROVED') {
          const courseVersion = await prisma.course.findUnique({
            where: { id: courseId },
            select: { contentVersion: true },
          });

          if (
            courseVersion &&
            enrollment.enrolledContentVersion < courseVersion.contentVersion
          ) {
            const snapshot = await CourseSnapshotService.getForVersion(
              courseId,
              enrollment.enrolledContentVersion,
            );
            if (snapshot) {
              return res.json(snapshot.snapshotData);
            }
            // Snapshot missing (shouldn't happen) — fall through to live.
          }
        }
      }

      const course = await CourseService.getById(courseId);
      res.json(course);
    } catch (err: any) {
      if (err.message === 'COURSE_NOT_FOUND') return res.status(404).json({ message: 'Cours introuvable' });
      res.status(500).json({ message: 'Échec de la récupération du cours' });
    }
  },

  /**
   * Version-aware projects endpoint.
   * Old-version enrolled students receive the projects from their snapshot.
   */
  async getProjects(req: Request, res: Response) {
    try {
      const courseId = String(req.params.id);
      const userId = (req as AuthRequest).user?.userId;
      const userRole = (req as AuthRequest).user?.role;
      const isStaff = userRole === 'ADMIN' || userRole === 'TEACHER';

      if (userId && !isStaff) {
        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId } },
          select: { status: true, enrolledContentVersion: true },
        });

        if (enrollment?.status === 'APPROVED') {
          const courseVersion = await prisma.course.findUnique({
            where: { id: courseId },
            select: { contentVersion: true },
          });

          if (courseVersion && enrollment.enrolledContentVersion < courseVersion.contentVersion) {
            const snapshot = await CourseSnapshotService.getForVersion(
              courseId,
              enrollment.enrolledContentVersion,
            );
            if (snapshot) {
              const data = snapshot.snapshotData as any;
              return res.json(data.projects ?? []);
            }
          }
        }
      }

      const projects = await ProjectModel.findByCourse(courseId);
      res.json(projects);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des projets' });
    }
  },

  async getCourseSubmissions(req: AuthRequest, res: Response) {
    try {
      const submissions = await ProjectModel.findSubmissionsByCourse(String(req.params.id));
      res.json(submissions);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des soumissions' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { teacherId: requestedTeacherId, ...rest } = req.body;
      const teacherId = requestedTeacherId || req.user!.userId;
      const course = await CourseService.create({ ...rest, teacherId });
      AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.COURSE_CREATE, targetType: 'Course', targetId: course.id, payload: { title: course.title, teacherId: course.teacherId }, ...extractRequestContext(req) });
      res.status(201).json(course);
    } catch {
      res.status(500).json({ message: 'Échec de la création du cours' });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const course = await CourseService.update(
        String(req.params.id),
        req.body,
        req.user!.userId,
        req.user!.role,
      );
      res.json(course);
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ message: 'Cours introuvable' });
      if (err.message === 'FORBIDDEN') return res.status(403).json({ message: 'Ce cours ne vous appartient pas' });
      res.status(500).json({ message: 'Échec de la mise à jour du cours' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await CourseService.delete(String(req.params.id));
      AuditService.admin({ actorId: req.user!.userId, actorRole: req.user!.role, action: AuditAction.COURSE_DELETE, targetType: 'Course', targetId: String(req.params.id), ...extractRequestContext(req) });
      res.json({ message: 'Course deleted' });
    } catch {
      res.status(500).json({ message: 'Échec de la suppression du cours' });
    }
  },

  async togglePublish(req: AuthRequest, res: Response) {
    try {
      const course = await prisma.course.findUnique({ where: { id: String(req.params.id) } });
      if (!course) return res.status(404).json({ message: 'Cours introuvable' });

      const isBeingPublished = !course.isPublished;

      const updated = await prisma.course.update({
        where: { id: course.id },
        data: { isPublished: isBeingPublished },
      });
      await CourseService.invalidateCourseCache(course.id);
      AuditService.admin({ actorId: (req as AuthRequest).user!.userId, actorRole: (req as AuthRequest).user!.role, action: isBeingPublished ? AuditAction.COURSE_PUBLISH : AuditAction.COURSE_UNPUBLISH, targetType: 'Course', targetId: course.id, ...extractRequestContext(req) });

      // Un seul job avec jobId fixe → BullMQ rejette automatiquement un doublon
      // si le cours est republié avant que le job soit traité (double-clic, bug UI…).
      if (isBeingPublished) {
        await queueEmail(
          'course-published',
          {
            courseId: course.id,
            courseTitle: course.title,
            courseDescription: course.shortDescription ?? '',
            frontendUrl: config.frontendUrl,
          },
          { jobId: `course-published:${course.id}` },
        );
      }

      res.json({ isPublished: updated.isPublished });
    } catch {
      res.status(500).json({ message: 'Échec du changement de statut de publication' });
    }
  },

  /**
   * Version-aware progress endpoint.
   * Old-version students have their progress computed against their snapshot lesson IDs.
   */
  async getProgress(req: AuthRequest, res: Response) {
    try {
      const courseId = String(req.params.id);
      const userId = req.user!.userId;

      let snapshotLessonIds: string[] | undefined;

      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { enrolledContentVersion: true, status: true, accessExpiresAt: true },
      });

      if (enrollment?.status === 'APPROVED') {
        const courseVersion = await prisma.course.findUnique({
          where: { id: courseId },
          select: { contentVersion: true },
        });

        if (courseVersion && enrollment.enrolledContentVersion < courseVersion.contentVersion) {
          const snapshot = await CourseSnapshotService.getForVersion(
            courseId,
            enrollment.enrolledContentVersion,
          );
          if (snapshot) {
            const data = snapshot.snapshotData as any;
            snapshotLessonIds = (data.modules ?? []).flatMap(
              (m: any) => (m.lessons ?? []).map((l: any) => l.id as string),
            );
          }
        }
      }

      const progress = await CourseService.getProgress(courseId, userId, snapshotLessonIds);
      const accessExpiresAt = enrollment?.accessExpiresAt ?? null;
      const isExpired = accessExpiresAt ? new Date() > accessExpiresAt : false;
      res.json({ ...progress, accessExpiresAt: accessExpiresAt?.toISOString() ?? null, isExpired });
    } catch {
      res.status(500).json({ message: 'Échec de la récupération de la progression' });
    }
  },

};
