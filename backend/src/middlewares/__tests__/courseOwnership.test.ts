import { Response } from 'express';
import { requireCourseOwnership, CourseOwnershipRequest } from '../courseOwnership.middleware';

// Mock prisma before importing the middleware
jest.mock('../../config/prisma', () => ({
  prisma: {
    course: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../../config/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function buildReq(overrides: Partial<CourseOwnershipRequest> = {}): CourseOwnershipRequest {
  return {
    params: { id: 'course-1' },
    user: { userId: 'user-1', role: 'TEACHER', email: 'teacher@test.com' },
    ...overrides,
  } as unknown as CourseOwnershipRequest;
}

function buildRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('requireCourseOwnership middleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes when TEACHER owns the course', async () => {
    (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      teacherId: 'user-1',
    });

    const req = buildReq();
    const res = buildRes();

    await requireCourseOwnership(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.course).toEqual({ id: 'course-1', teacherId: 'user-1' });
  });

  it('returns 403 when TEACHER does NOT own the course', async () => {
    (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      teacherId: 'other-teacher',
    });

    const req = buildReq({ user: { userId: 'user-1', role: 'TEACHER', email: 'teacher@test.com' } });
    const res = buildRes();

    await requireCourseOwnership(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: not your course' });
  });

  it('passes when ADMIN even if not the course teacher', async () => {
    (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      teacherId: 'some-other-teacher',
    });

    const req = buildReq({ user: { userId: 'admin-1', role: 'ADMIN', email: 'admin@test.com' } });
    const res = buildRes();

    await requireCourseOwnership(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 404 when course does not exist', async () => {
    (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

    const req = buildReq();
    const res = buildRes();

    await requireCourseOwnership(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Course not found' });
  });

  it('returns 400 when no course id in params', async () => {
    const req = buildReq({ params: {} });
    const res = buildRes();

    await requireCourseOwnership(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
