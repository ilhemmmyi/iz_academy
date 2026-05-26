import { prisma } from '../config/prisma';

/**
 * Asserts that a student holds an active, non-expired APPROVED enrollment for
 * the given course. Throws a typed FORBIDDEN error on any violation.
 *
 * Call this at the top of any service method that touches student-submitted
 * content (project submission, file upload, resubmission, etc.) — before any
 * DB writes or queue jobs are enqueued.
 *
 * Single Prisma query: selects only the two fields needed for the checks.
 * Both error codes are 'FORBIDDEN' to avoid revealing enrollment state to
 * unauthenticated or unauthorized callers.
 */
export async function assertActiveEnrollment(studentId: string, courseId: string): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: studentId, courseId } },
    select: { status: true, accessExpiresAt: true },
  });

  if (!enrollment || enrollment.status !== 'APPROVED') {
    throw Object.assign(new Error('Not enrolled in this course'), { code: 'FORBIDDEN' });
  }

  if (enrollment.accessExpiresAt && enrollment.accessExpiresAt < new Date()) {
    throw Object.assign(new Error('Course access has expired'), { code: 'FORBIDDEN' });
  }
}
