import { prisma } from '../config/prisma';
import { SubmissionStatus } from '.prisma/client';
import { certificateQueue } from '../queues/certificate.queue';
import { ProjectModel } from '../models/project.model';
import { LessonModel } from '../models/lesson.model';
import { ActivityService } from './activity.service';

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

    // One submission per COURSE (not per project).
    // Find any existing submission for this student in this course.
    const existingForCourse = await prisma.projectSubmission.findFirst({
      where: { studentId, courseId },
    });

    if (existingForCourse) {
      // Allow resubmission only when the teacher asked for improvements
      if (existingForCourse.status !== 'NEEDS_IMPROVEMENT') {
        throw Object.assign(
          new Error('Vous avez déjà soumis un projet pour ce cours.'),
          { code: 'ALREADY_SUBMITTED' },
        );
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
   * When VALIDATED, the certificate is auto-generated without any admin intervention.
   * If status is NEEDS_IMPROVEMENT, any existing certificate is revoked.
   */
  async review(submissionId: string, status: SubmissionStatus, feedback?: string) {
    const submission = await ProjectModel.updateSubmission(submissionId, status, feedback);
    const studentId = (submission as any).studentId;
    const courseId = (submission as any).project?.courseId;

    if (status === 'NEEDS_IMPROVEMENT') {
      await prisma.certificate.deleteMany({
        where: { userId: studentId, courseId: (submission as any).project.courseId },
      });
    }

    // Auto-generate certificate as soon as the teacher validates
    if (status === 'VALIDATED' && courseId) {
      await certificateQueue.add(
        'generate',
        { userId: studentId, courseId },
        { jobId: `cert:${studentId}:${courseId}` },
      );
    }

    // Notify student of their project decision
    const projectTitle = (submission as any).project?.title || 'votre projet';
    const actMessage =
      status === 'VALIDATED'
        ? `"${projectTitle}" a été validé par votre formateur`
        : `"${projectTitle}" nécessite des améliorations selon votre formateur`;
    ActivityService.create(
      studentId,
      'PROJECT_UPDATE',
      actMessage,
      courseId ? `/student/projects/${courseId}` : '/student',
    ).catch(() => {});
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
    await ProjectModel.deleteSubmission(submissionId);
  },
};
