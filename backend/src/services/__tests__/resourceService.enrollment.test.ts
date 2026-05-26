/**
 * ResourceService.getByCourse() — enrollment authorization tests.
 *
 * Verifies:
 *   ✅  ADMIN can access resources for any course (no DB checks)
 *   ✅  TEACHER can access resources for their own course
 *   ❌  TEACHER is blocked for a course they don't own (FORBIDDEN)
 *   ❌  TEACHER is blocked when course does not exist (FORBIDDEN)
 *   ✅  actively enrolled STUDENT can access resources
 *   ❌  unenrolled / expired STUDENT is blocked (FORBIDDEN propagated from assertActiveEnrollment)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../config/prisma', () => ({
  prisma: {
    course: { findUnique: jest.fn() },
    courseResource: { findMany: jest.fn() },
  },
}));

jest.mock('../../utils/enrollmentGuard', () => ({
  assertActiveEnrollment: jest.fn(),
}));

jest.mock('../../utils/storage', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { prisma } from '../../config/prisma';
import { assertActiveEnrollment } from '../../utils/enrollmentGuard';
import { ResourceService } from '../resource.service';

const mockFindCourse    = prisma.course.findUnique         as jest.Mock;
const mockFindResources = prisma.courseResource.findMany   as jest.Mock;
const mockAssertEnroll  = assertActiveEnrollment           as jest.Mock;

// ── Constants ─────────────────────────────────────────────────────────────────

const COURSE_ID        = 'course-1';
const TEACHER_ID       = 'teacher-1';
const OTHER_TEACHER_ID = 'teacher-other';
const STUDENT_ID       = 'student-1';
const fakeResources    = [{ id: 'res-1', title: 'doc.pdf', courseId: COURSE_ID }];

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockFindResources.mockResolvedValue(fakeResources);
});

describe('ResourceService.getByCourse() — ADMIN', () => {
  it('returns resources without any course or enrollment check', async () => {
    await expect(ResourceService.getByCourse(COURSE_ID, 'admin-1', 'ADMIN')).resolves.toEqual(fakeResources);
    expect(mockFindCourse).not.toHaveBeenCalled();
    expect(mockAssertEnroll).not.toHaveBeenCalled();
  });
});

describe('ResourceService.getByCourse() — TEACHER', () => {
  it('returns resources for their own course', async () => {
    mockFindCourse.mockResolvedValue({ teacherId: TEACHER_ID });
    await expect(ResourceService.getByCourse(COURSE_ID, TEACHER_ID, 'TEACHER')).resolves.toEqual(fakeResources);
    expect(mockAssertEnroll).not.toHaveBeenCalled();
  });

  it('throws FORBIDDEN for a course they do not own', async () => {
    mockFindCourse.mockResolvedValue({ teacherId: TEACHER_ID });
    await expect(ResourceService.getByCourse(COURSE_ID, OTHER_TEACHER_ID, 'TEACHER'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mockFindResources).not.toHaveBeenCalled();
  });

  it('throws FORBIDDEN when course does not exist', async () => {
    mockFindCourse.mockResolvedValue(null);
    await expect(ResourceService.getByCourse(COURSE_ID, TEACHER_ID, 'TEACHER'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mockFindResources).not.toHaveBeenCalled();
  });
});

describe('ResourceService.getByCourse() — STUDENT', () => {
  it('returns resources when enrollment is active', async () => {
    mockAssertEnroll.mockResolvedValue(undefined);
    await expect(ResourceService.getByCourse(COURSE_ID, STUDENT_ID, 'STUDENT')).resolves.toEqual(fakeResources);
    expect(mockAssertEnroll).toHaveBeenCalledWith(STUDENT_ID, COURSE_ID);
  });

  it('propagates FORBIDDEN from assertActiveEnrollment when unenrolled or expired', async () => {
    mockAssertEnroll.mockRejectedValue(Object.assign(new Error('Not enrolled'), { code: 'FORBIDDEN' }));
    await expect(ResourceService.getByCourse(COURSE_ID, STUDENT_ID, 'STUDENT'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mockFindResources).not.toHaveBeenCalled();
  });
});
