import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { CategoryService } from '../services/category.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';
import { ProjectModel } from '../models/project.model';

export const CourseController = {

  async getCategories(_req: Request, res: Response) {
    try {
      const categories = await CategoryService.getAll();
      res.json(categories);
    } catch {
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  },

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
      const category = await CategoryService.create(name);
      res.status(201).json(category);
    } catch (err: any) {
      if (err.code === 'P2002') return res.status(409).json({ message: 'Category already exists' });
      res.status(500).json({ message: 'Failed to create category' });
    }
  },

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
      const category = await CategoryService.update(String(req.params.id), name);
      res.json(category);
    } catch (err: any) {
      if (err.code === 'P2025') return res.status(404).json({ message: 'Category not found' });
      if (err.code === 'P2002') return res.status(409).json({ message: 'Category already exists' });
      res.status(500).json({ message: 'Failed to update category' });
    }
  },

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      await CategoryService.delete(String(req.params.id));
      res.json({ message: 'Category deleted' });
    } catch (err: any) {
      if (err.code === 'P2025') return res.status(404).json({ message: 'Category not found' });
      if (err.code === 'P2003') return res.status(409).json({ message: 'Cannot delete: category is used by courses' });
      res.status(500).json({ message: 'Failed to delete category' });
    }
  },

  async getAllAdmin(_req: AuthRequest, res: Response) {
    try {
      const courses = await CourseService.getAllAdmin();
      res.json(courses);
    } catch {
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  },

  async getMyCourses(req: AuthRequest, res: Response) {
    try {
      const courses = await CourseService.getMine(req.user!.userId);
      res.json(courses);
    } catch {
      res.status(500).json({ message: 'Failed to fetch courses' });
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
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const course = await CourseService.getById(String(req.params.id));
      res.json(course);
    } catch (err: any) {
      if (err.message === 'COURSE_NOT_FOUND') return res.status(404).json({ message: 'Course not found' });
      res.status(500).json({ message: 'Failed to fetch course' });
    }
  },

  async getProjects(req: Request, res: Response) {
    try {
      const projects = await ProjectModel.findByCourse(String(req.params.id));
      res.json(projects);
    } catch {
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  },

  async getCourseSubmissions(req: AuthRequest, res: Response) {
    try {
      const submissions = await ProjectModel.findSubmissionsByCourse(String(req.params.id));
      res.json(submissions);
    } catch {
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { teacherId: requestedTeacherId, ...rest } = req.body;
      const teacherId = requestedTeacherId || req.user!.userId;
      const course = await CourseService.create({ ...rest, teacherId });
      res.status(201).json(course);
    } catch {
      res.status(500).json({ message: 'Failed to create course' });
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
      if (err.message === 'NOT_FOUND') return res.status(404).json({ message: 'Course not found' });
      if (err.message === 'FORBIDDEN') return res.status(403).json({ message: 'Not your course' });
      res.status(500).json({ message: 'Failed to update course' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await CourseService.delete(String(req.params.id));
      res.json({ message: 'Course deleted' });
    } catch {
      res.status(500).json({ message: 'Failed to delete course' });
    }
  },

  async togglePublish(req: AuthRequest, res: Response) {
    try {
      const course = await prisma.course.findUnique({ where: { id: String(req.params.id) } });
      if (!course) return res.status(404).json({ message: 'Course not found' });
      const updated = await prisma.course.update({
        where: { id: course.id },
        data: { isPublished: !course.isPublished },
      });
      // C-4: invalidate stale cache after publish toggle
      await CourseService.invalidateCourseCache(course.id);
      res.json({ isPublished: updated.isPublished });
    } catch {
      res.status(500).json({ message: 'Failed to toggle publish status' });
    }
  },

  async getProgress(req: AuthRequest, res: Response) {
    try {
      const progress = await CourseService.getProgress(String(req.params.id), req.user!.userId);
      res.json(progress);
    } catch {
      res.status(500).json({ message: 'Failed to fetch progress' });
    }
  },

  async getReviews(req: Request, res: Response) {
    try {
      const courseId = String(req.params.id);
      const reviews = await prisma.courseReview.findMany({
        where: { courseId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const avg = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      res.json({ reviews, average: Math.round(avg * 10) / 10, total: reviews.length });
    } catch {
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  },

  async submitReview(req: AuthRequest, res: Response) {
    try {
      const courseId = String(req.params.id);
      const userId = req.user!.userId;
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      const review = await prisma.courseReview.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { rating: Number(rating), comment: comment?.trim() || null },
        create: { userId, courseId, rating: Number(rating), comment: comment?.trim() || null },
        include: { user: { select: { id: true, name: true } } },
      });
      res.json(review);
    } catch {
      res.status(500).json({ message: 'Failed to submit review' });
    }
  },
};

