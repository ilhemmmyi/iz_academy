/**
 * LessonResourceService.getByLesson() — enrollment authorization tests.
 *
 * Verifies:
 *   ✅  ADMIN can access resources for any lesson
 *   ✅  TEACHER can access resources for a lesson in their own course
 *   ❌  TEACHER is blocked for a lesson in a course they don't own (FORBIDDEN)
 *   ✅  actively enrolled STUDENT can access resources
 *   ❌  unenrolled / expired STUDENT is blocked (FORBIDDEN propagated from assertActiveEnrollment)
 *   ❌  unknown lessonId returns NOT_FOUND for non-ADMIN users
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../config/prisma', () => ({
  prisma: {
    lesson: { findUnique: jest.fn() },
    lessonResource: { findMany: jest.fn() },
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
import { LessonResourceService } from '../lessonResource.service';

const mockFindLesson     = prisma.lesson.findUnique          as jest.Mock;
const mockFindResources  = prisma.lessonResource.findMany    as jest.Mock;
const mockAssertEnroll   = assertActiveEnrollment            as jest.Mock;

// ── Constants ─────────────────────────────────────────────────────────────────

const LESSON_ID        = 'lesson-1';
const COURSE_ID        = 'course-1';
const TEACHER_ID       = 'teacher-1';
const OTHER_TEACHER_ID = 'teacher-other';
const STUDENT_ID       = 'student-1';
const fakeResources    = [{ id: 'lr-1', title: 'slide.pdf', lessonId: LESSON_ID }];

const fakeLesson = {
  id: LESSON_ID,
  module: {
    course: { id: COURSE_ID, teacherId: TEACHER_ID },
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockFindResources.mockResolvedValue(fakeResources);
});

describe('LessonResourceService.getByLesson() — ADMIN', () => {
  it('returns resources without any lesson or enrollment check', async () => {
    await expect(LessonResourceService.getByLesson(LESSON_ID, 'admin-1', 'ADMIN')).resolves.toEqual(fakeResources);
    expect(mockFindLesson).not.toHaveBeenCalled();
    expect(mockAssertEnroll).not.toHaveBeenCalled();
  });
});

describe('LessonResourceService.getByLesson() — TEACHER', () => {
  it('returns resources for a lesson in their own course', async () => {
    mockFindLesson.mockResolvedValue(fakeLesson);
    await expect(LessonResourceService.getByLesson(LESSON_ID, TEACHER_ID, 'TEACHER')).resolves.toEqual(fakeResources);
    expect(mockAssertEnroll).not.toHaveBeenCalled();
  });

  it('throws FORBIDDEN for a lesson in a course they do not own', async () => {
    mockFindLesson.mockResolvedValue(fakeLesson);
    await expect(LessonResourceService.getByLesson(LESSON_ID, OTHER_TEACHER_ID, 'TEACHER'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mockFindResources).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when lesson does not exist', async () => {
    mockFindLesson.mockResolvedValue(null);
    await expect(LessonResourceService.getByLesson('nonexistent', TEACHER_ID, 'TEACHER'))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(mockFindResources).not.toHaveBeenCalled();
  });
});

describe('LessonResourceService.getByLesson() — STUDENT', () => {
  it('returns resources when enrollment is active', async () => {
    mockFindLesson.mockResolvedValue(fakeLesson);
    mockAssertEnroll.mockResolvedValue(undefined);

    await expect(LessonResourceService.getByLesson(LESSON_ID, STUDENT_ID, 'STUDENT')).resolves.toEqual(fakeResources);
    expect(mockAssertEnroll).toHaveBeenCalledWith(STUDENT_ID, COURSE_ID);
  });

  it('propagates FORBIDDEN from assertActiveEnrollment when unenrolled or expired', async () => {
    mockFindLesson.mockResolvedValue(fakeLesson);
    mockAssertEnroll.mockRejectedValue(Object.assign(new Error('Not enrolled'), { code: 'FORBIDDEN' }));

    await expect(LessonResourceService.getByLesson(LESSON_ID, STUDENT_ID, 'STUDENT'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mockFindResources).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when lesson does not exist', async () => {
    mockFindLesson.mockResolvedValue(null);
    await expect(LessonResourceService.getByLesson('nonexistent', STUDENT_ID, 'STUDENT'))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
