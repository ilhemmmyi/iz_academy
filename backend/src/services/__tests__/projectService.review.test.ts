/**
 * Tests for ProjectService.review() ownership enforcement.
 *
 * Verifies that a TEACHER can only review submissions belonging to courses
 * they own, while an ADMIN can review any submission.
 */

jest.mock('../../config/prisma', () => ({
  prisma: {
    projectSubmission: { findUnique: jest.fn() },
    course: { findUnique: jest.fn() },
    certificate: { deleteMany: jest.fn() },
  },
}));

jest.mock('../../models/project.model', () => ({
  ProjectModel: {
    updateSubmission: jest.fn(),
  },
}));

jest.mock('../../queues/certificate.queue', () => ({
  certificateQueue: { add: jest.fn() },
}));

jest.mock('../../services/activity.service', () => ({
  ActivityService: { create: jest.fn().mockResolvedValue(undefined) },
}));

import { prisma } from '../../config/prisma';
import { ProjectModel } from '../../models/project.model';
import { ProjectService } from '../project.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockProjectModel = ProjectModel as jest.Mocked<typeof ProjectModel>;

const TEACHER_ID = 'teacher-1';
const OTHER_TEACHER_ID = 'teacher-2';
const ADMIN_ID = 'admin-1';
const SUBMISSION_ID = 'sub-1';
const COURSE_ID = 'course-1';

const fakeSubmission = {
  id: SUBMISSION_ID,
  studentId: 'student-1',
  courseId: COURSE_ID,
  project: { courseId: COURSE_ID, title: 'Test Project' },
  status: 'NEEDS_IMPROVEMENT',
};

describe('ProjectService.review() — ownership enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEACHER role', () => {
    it('allows review when teacher owns the course', async () => {
      (mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(fakeSubmission);
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
        teacherId: TEACHER_ID,
      });
      (mockProjectModel.updateSubmission as jest.Mock).mockResolvedValue(fakeSubmission);
      (mockPrisma.certificate.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(
        ProjectService.review(SUBMISSION_ID, 'NEEDS_IMPROVEMENT', 'Fix it', TEACHER_ID, 'TEACHER'),
      ).resolves.toBeDefined();
    });

    it('throws FORBIDDEN when teacher does not own the course', async () => {
      (mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(fakeSubmission);
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
        teacherId: OTHER_TEACHER_ID,
      });

      await expect(
        ProjectService.review(SUBMISSION_ID, 'NEEDS_IMPROVEMENT', undefined, TEACHER_ID, 'TEACHER'),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });

      expect(mockProjectModel.updateSubmission).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when submission does not exist', async () => {
      (mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ProjectService.review('nonexistent', 'VALIDATED', undefined, TEACHER_ID, 'TEACHER'),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('ADMIN role', () => {
    it('allows review of any submission without ownership check', async () => {
      (mockProjectModel.updateSubmission as jest.Mock).mockResolvedValue(fakeSubmission);
      (mockPrisma.certificate.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(
        ProjectService.review(SUBMISSION_ID, 'NEEDS_IMPROVEMENT', 'Improve it', ADMIN_ID, 'ADMIN'),
      ).resolves.toBeDefined();

      // Admin path must NOT query course ownership
      expect(mockPrisma.projectSubmission.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.course.findUnique).not.toHaveBeenCalled();
    });
  });
});
