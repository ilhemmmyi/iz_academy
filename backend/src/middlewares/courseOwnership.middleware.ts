import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../config/prisma';

export interface CourseOwnershipRequest extends AuthRequest {
  course?: { id: string; teacherId: string };
}

/**
 * Enforces resource-level ownership for course mutation routes.
 *
 * Reads :id or :courseId from params, fetches the course, then:
 *   - ADMIN → always passes
 *   - TEACHER whose userId matches course.teacherId → passes
 *   - Anyone else → 403
 *
 * Attaches req.course = { id, teacherId } so downstream handlers
 * can skip the re-fetch for auth purposes.
 *
 * Must be placed AFTER authenticate + requireRole.
 */
export const requireCourseOwnership = async (
  req: CourseOwnershipRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rawId = req.params.id ?? req.params.courseId;
    const courseId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!courseId) {
      res.status(400).json({ message: 'Course ID required' });
      return;
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.userId) {
      res.status(403).json({ message: 'Forbidden: not your course' });
      return;
    }

    req.course = course;
    next();
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
