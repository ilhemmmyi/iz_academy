import { prisma } from '../config/prisma';
import { SubmissionStatus } from '.prisma/client';
import { certificateQueue } from '../queues/certificate.queue';
import { ProjectModel } from '../models/project.model';
import { LessonModel } from '../models/lesson.model';

const GRACE_MS = 3 * 60 * 1000;

export const ProjectService = {

  async submit(studentId: string, projectId: string, githubUrl: string, comment?: string) {
    const project = await ProjectModel.findById(projectId);
    if (!project) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' });

    const courseId = project.courseId;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } },
    });
    if (!course) throw Object.assign(new Error('Course not found'), { code: 'NOT_FOUND' });

    const allLessonIds = course.modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
    const completedCount = await LessonModel.countCompletedByIds(studentId, allLessonIds);
    if (completedCount < allLessonIds.length) {
      throw Object.assign(new Error('Lessons incomplete'), { code: 'LESSONS_INCOMPLETE' });
    }

    const existing = await ProjectModel.findSubmission(projectId, studentId);
    if (existing) {
      const elapsed = Date.now() - new Date(existing.submittedAt).getTime();
      const needsImprovement = existing.status === 'NEEDS_IMPROVEMENT';
      if (elapsed >= GRACE_MS && !needsImprovement) {
        throw Object.assign(new Error('Grace period expired'), { code: 'GRACE_EXPIRED' });
      }
    }

    return ProjectModel.upsertSubmission({
      projectId,
      studentId,
      courseId,
      githubUrl: githubUrl.trim(),
      comment: comment || null,
    });
  },

  async mySubmissions(studentId: string) {
    return ProjectModel.findMySubmissions(studentId);
  },

  async teacherSubmissions(teacherId: string) {
    const courses = await prisma.course.findMany({
      where: { teacherId },
      select: { id: true, title: true },
    });
    const courseIds = courses.map((c: any) => c.id);

    const submissions = await ProjectModel.findTeacherSubmissions(courseIds);

    const courseMap = Object.fromEntries(courses.map((c: any) => [c.id, c.title]));
    return submissions.map((s: any) => ({ ...s, courseTitle: courseMap[s.courseId] || '' }));
  },

  /**
   * Teacher validates or requests improvements on a submission.
   * Certificate is NOT triggered here — admin approval is required first.
   * If status is NEEDS_IMPROVEMENT, any existing certificate is revoked.
   */
  async review(submissionId: string, status: SubmissionStatus, feedback?: string) {
    const submission = await ProjectModel.updateSubmission(submissionId, status, feedback);
    if (status === 'NEEDS_IMPROVEMENT') {
      // Revoke any certificate for this student/course — project is no longer valid
      await prisma.certificate.deleteMany({
        where: { userId: (submission as any).studentId, courseId: (submission as any).project.courseId },
      });
      // Also reset adminApproved so the admin must re-approve after teacher re-validates
      await prisma.projectSubmission.update({
        where: { id: submissionId },
        data: { adminApproved: false, adminApprovedAt: null, adminApprovedById: null },
      });
    }
    return submission;
  },

  /**
   * Admin gives final authorization for certificate generation.
   * All 4 conditions are checked here before the job is queued:
   *   1. All lessons completed
   *   2. Project submitted
   *   3. Project validated by teacher (status === VALIDATED)
   *   4. Admin approval (this step)
   */
  async adminApprove(submissionId: string, adminId: string) {
    // This update only succeeds if status === VALIDATED (enforced in the model).
    const submission = await ProjectModel.adminApprove(submissionId, adminId);
    if (!submission) {
      throw Object.assign(
        new Error('Submission not found or not yet validated by the teacher'),
        { code: 'NOT_FOUND_OR_NOT_VALIDATED' },
      );
    }

    const { studentId, project } = submission;
    const courseId = project.courseId;

    // Pre-flight: verify lesson completion before queuing
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: { select: { id: true } } } } },
    });
    if (!course) throw Object.assign(new Error('Course not found'), { code: 'NOT_FOUND' });

    const allLessonIds = course.modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
    const completedCount = await LessonModel.countCompletedByIds(studentId, allLessonIds);
    if (completedCount < allLessonIds.length) {
      throw Object.assign(
        new Error('Student has not completed all lessons yet'),
        { code: 'LESSONS_INCOMPLETE' },
      );
    }

    // All 4 conditions met — enqueue certificate generation
    await certificateQueue.add(
      'generate',
      { userId: studentId, courseId },
      // Unique key prevents duplicate jobs if admin somehow double-clicks
      { jobId: `cert:${studentId}:${courseId}` },
    );

    return submission;
  },

  /**
   * Admin dashboard: submissions validated by teacher but awaiting admin approval.
   */
  listValidatedPendingApproval: () => ProjectModel.findValidatedPendingApproval(),

  async deleteSubmission(studentId: string, submissionId: string) {
    const submission = await ProjectModel.findSubmissionById(submissionId);
    if (!submission) throw Object.assign(new Error('Submission not found'), { code: 'NOT_FOUND' });
    if (submission.studentId !== studentId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

    const elapsed = Date.now() - new Date(submission.submittedAt).getTime();
    if (elapsed >= GRACE_MS) {
      throw Object.assign(new Error('Grace period expired'), { code: 'GRACE_EXPIRED' });
    }

    await ProjectModel.deleteSubmission(submissionId);
  },
};
