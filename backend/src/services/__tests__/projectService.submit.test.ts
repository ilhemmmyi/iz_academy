/**
 * ProjectService.submit() — enrollment authorization tests.
 *
 * Verifies:
 *   ✅  enrolled student with active access can submit
 *   ❌  unenrolled student is blocked (FORBIDDEN)
 *   ❌  PENDING enrollment is blocked (FORBIDDEN)
 *   ❌  REJECTED enrollment is blocked (FORBIDDEN)
 *   ❌  expired access is blocked (FORBIDDEN)
 *   ✅  submission allowed when access expiry is in the future
 *   ❌  cross-course submission blocked by enrollment check (FORBIDDEN)
 *   ❌  duplicate submission (non-improvement) blocked (ALREADY_SUBMITTED)
 *   ✅  resubmission allowed when existing status is NEEDS_IMPROVEMENT
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../config/prisma', () => ({
  prisma: {
    enrollment: { findUnique: jest.fn() },
    projectSubmission: { findFirst: jest.fn() },
  },
}));

jest.mock('../../models/project.model', () => ({
  ProjectModel: {
    findById: jest.fn(),
    upsertSubmission: jest.fn(),
  },
}));

jest.mock('../../queues/certificate.queue', () => ({
  certificateQueue: { add: jest.fn() },
}));

jest.mock('../../services/activity.service', () => ({
  ActivityService: { create: jest.fn().mockResolvedValue(undefined) },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { prisma } from '../../config/prisma';
import { ProjectModel } from '../../models/project.model';
import { ProjectService } from '../project.service';

const mockEnrollment  = prisma.enrollment.findUnique  as jest.Mock;
const mockFindFirst   = prisma.projectSubmission.findFirst as jest.Mock;
const mockFindById    = ProjectModel.findById          as jest.Mock;
const mockUpsert      = ProjectModel.upsertSubmission  as jest.Mock;

// ── Constants ─────────────────────────────────────────────────────────────────

const STUDENT_ID  = 'student-1';
const PROJECT_ID  = 'project-1';
const COURSE_ID   = 'course-1';
const OTHER_COURSE_ID = 'course-other';

const fakeProject = { id: PROJECT_ID, courseId: COURSE_ID };
const fakeSubmission = { id: 'sub-1', projectId: PROJECT_ID, studentId: STUDENT_ID, courseId: COURSE_ID };

const activeEnrollment  = { status: 'APPROVED',  accessExpiresAt: null };
const expiredEnrollment = { status: 'APPROVED',  accessExpiresAt: new Date(Date.now() - 86_400_000) }; // yesterday
const futureExpiry      = { status: 'APPROVED',  accessExpiresAt: new Date(Date.now() + 86_400_000) }; // tomorrow
const pendingEnrollment = { status: 'PENDING',   accessExpiresAt: null };
const rejectedEnrollment = { status: 'REJECTED', accessExpiresAt: null };

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

describe('ProjectService.submit() — enrollment guard', () => {

  describe('✅ allowed submissions', () => {
    it('succeeds for an enrolled student with no expiry', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(activeEnrollment);
      mockFindFirst.mockResolvedValue(null);
      mockUpsert.mockResolvedValue(fakeSubmission);

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y')).resolves.toBe(fakeSubmission);
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ studentId: STUDENT_ID, courseId: COURSE_ID }));
    });

    it('succeeds when access expiry is in the future', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(futureExpiry);
      mockFindFirst.mockResolvedValue(null);
      mockUpsert.mockResolvedValue(fakeSubmission);

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y')).resolves.toBeDefined();
    });

    it('allows resubmission when existing status is NEEDS_IMPROVEMENT', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(activeEnrollment);
      mockFindFirst.mockResolvedValue({ id: 'sub-old', status: 'NEEDS_IMPROVEMENT', studentId: STUDENT_ID, courseId: COURSE_ID });
      mockUpsert.mockResolvedValue(fakeSubmission);

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y')).resolves.toBeDefined();
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe('❌ blocked — enrollment violations', () => {
    it('throws FORBIDDEN when student has no enrollment record', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(null);

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y'))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN for PENDING enrollment (awaiting approval)', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(pendingEnrollment);

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y'))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN for REJECTED enrollment', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(rejectedEnrollment);

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y'))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when access has expired', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(expiredEnrollment);

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y'))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('blocks cross-course submission: project belongs to a different course than enrolled', async () => {
      // Student is enrolled in OTHER_COURSE_ID — project belongs to COURSE_ID.
      // Enrollment lookup uses the project's courseId, so findUnique returns null.
      mockFindById.mockResolvedValue({ id: PROJECT_ID, courseId: COURSE_ID });
      mockEnrollment.mockResolvedValue(null); // no enrollment in COURSE_ID

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y'))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });

      // Guard must use the project's courseId, not any caller-supplied value
      expect(mockEnrollment).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId_courseId: { userId: STUDENT_ID, courseId: COURSE_ID } } }),
      );
      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });

  describe('❌ blocked — duplicate submission', () => {
    it('throws ALREADY_SUBMITTED when a PENDING submission already exists', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(activeEnrollment);
      mockFindFirst.mockResolvedValue({ id: 'sub-old', status: 'PENDING', studentId: STUDENT_ID, courseId: COURSE_ID });

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y'))
        .rejects.toMatchObject({ code: 'ALREADY_SUBMITTED' });

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('throws ALREADY_SUBMITTED when a VALIDATED submission already exists', async () => {
      mockFindById.mockResolvedValue(fakeProject);
      mockEnrollment.mockResolvedValue(activeEnrollment);
      mockFindFirst.mockResolvedValue({ id: 'sub-old', status: 'VALIDATED', studentId: STUDENT_ID, courseId: COURSE_ID });

      await expect(ProjectService.submit(STUDENT_ID, PROJECT_ID, 'https://github.com/x/y'))
        .rejects.toMatchObject({ code: 'ALREADY_SUBMITTED' });
    });
  });

  describe('❌ blocked — unknown project', () => {
    it('throws NOT_FOUND when projectId does not exist', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(ProjectService.submit(STUDENT_ID, 'nonexistent', 'https://github.com/x/y'))
        .rejects.toMatchObject({ code: 'NOT_FOUND' });

      // Guard must not run if the project doesn't exist
      expect(mockEnrollment).not.toHaveBeenCalled();
      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });
});
