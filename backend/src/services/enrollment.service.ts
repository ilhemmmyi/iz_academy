import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/email.queue';
import { EnrollmentModel } from '../models/enrollment.model';
import { LessonModel } from '../models/lesson.model';
import { ActivityModel } from '../models/activity.model';

export const EnrollmentService = {

  async request(userId: string, courseId: string, message?: string) {
    const existing = await EnrollmentModel.findByUserAndCourse(userId, courseId);
    if (existing) throw new Error('ALREADY_ENROLLED');
    return EnrollmentModel.create(userId, courseId, message);
  },

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const enrollment = await EnrollmentModel.updateStatus(id, status);
    // Auto-create a payment record when an enrollment is approved
    if (status === 'APPROVED') {
      const alreadyPaid = await prisma.payment.findFirst({
        where: { userId: enrollment.userId, courseId: enrollment.courseId },
      });
      if (!alreadyPaid) {
        await prisma.payment.create({
          data: {
            userId: enrollment.userId,
            courseId: enrollment.courseId,
            amount: enrollment.course.price,
            status: 'COMPLETED',
          },
        });
      }
    }
    emailQueue.add('enrollment-status', {
      email: enrollment.user.email,
      name: enrollment.user.name,
      courseName: enrollment.course.title,
      status,
    }).catch((err) => console.error('Email queue error:', err));

    if (status === 'APPROVED') {
      ActivityModel.create(
        enrollment.userId,
        'ENROLLMENT_APPROVED',
        `Votre demande d'inscription au cours "${enrollment.course.title}" a été acceptée`,
        `/student/course/${enrollment.courseId}`,
      ).catch((err) => console.error('Activity create error:', err));
    }

    return enrollment;
  },

  getAll: () => EnrollmentModel.findAll(),

  delete: (id: string) => EnrollmentModel.delete(id),

  async getByUser(userId: string) {
    const enrollments = await EnrollmentModel.findByUser(userId);

    // Only compute progress for approved enrollments
    const approvedCourseIds = enrollments
      .filter(e => e.status === 'APPROVED')
      .map(e => e.courseId);

    if (approvedCourseIds.length === 0) return enrollments.map(e => ({ ...e, progress: null }));

    // Fetch total lesson counts per course
    const courses = await prisma.course.findMany({
      where: { id: { in: approvedCourseIds } },
      include: { modules: { include: { lessons: { select: { id: true } } } } },
    });
    const totalLessonsMap: Record<string, number> = {};
    courses.forEach(c => {
      totalLessonsMap[c.id] = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    });

    // Fetch completed lesson counts per course for this user
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        completed: true,
        lesson: { module: { courseId: { in: approvedCourseIds } } },
      },
      include: { lesson: { include: { module: { select: { courseId: true } } } } },
    });
    const completedLessonsMap: Record<string, number> = {};
    lessonProgress.forEach(p => {
      const cId = p.lesson.module.courseId;
      completedLessonsMap[cId] = (completedLessonsMap[cId] || 0) + 1;
    });

    // Fetch project submissions for this user
    const submissions = await prisma.projectSubmission.findMany({
      where: { studentId: userId, courseId: { in: approvedCourseIds } },
      select: { courseId: true, status: true },
    });
    const submissionMap: Record<string, string> = {};
    submissions.forEach(s => { submissionMap[s.courseId] = s.status; });

    // Fetch certificates for this user
    const certificates = await prisma.certificate.findMany({
      where: { userId, courseId: { in: approvedCourseIds } },
      select: { id: true, courseId: true, fileUrl: true },
    });
    const certMap: Record<string, { id: string; fileUrl: string | null }> = {};
    certificates.forEach(c => { certMap[c.courseId] = { id: c.id, fileUrl: c.fileUrl }; });

    return enrollments.map(e => {
      if (e.status !== 'APPROVED') return { ...e, progress: null };

      const totalLessons = totalLessonsMap[e.courseId] || 0;
      const completedLessons = completedLessonsMap[e.courseId] || 0;
      const lessonPct = totalLessons > 0 ? (completedLessons / totalLessons) * 70 : 0;

      const projectStatus = submissionMap[e.courseId] ?? null;
      let projectPct = 0;
      if (projectStatus && projectStatus !== 'PENDING') projectPct = 20;
      if (projectStatus === 'VALIDATED') projectPct = 30;

      const percentage = Math.round(lessonPct + projectPct);

      return {
        ...e,
        progress: {
          totalLessons,
          completedLessons,
          projectStatus,
          percentage,
          certificate: certMap[e.courseId] ?? null,
        },
      };
    });
  },

  async getTeacherStudents(teacherId: string) {
    // Get all courses by this teacher
    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: { modules: { include: { lessons: { select: { id: true } } } } },
    });

    const courseIds = courses.map(c => c.id);
    const totalLessonsMap: Record<string, number> = {};
    courses.forEach(c => {
      totalLessonsMap[c.id] = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    });

    // Get approved enrollments for those courses
    const enrollments = await EnrollmentModel.findApprovedByCourseIds(courseIds);

    // Fetch lesson progress for all enrolled students
    const studentIds = [...new Set(enrollments.map(e => e.userId))];
    const allProgress = await LessonModel.findCompletedByCourseIds(studentIds, courseIds);

    // Group completed lessons by userId+courseId
    const completedMap: Record<string, number> = {};
    allProgress.forEach(p => {
      const key = `${p.userId}:${p.lesson.module.courseId}`;
      completedMap[key] = (completedMap[key] || 0) + 1;
    });

    return enrollments.map(e => {
      const total = totalLessonsMap[e.courseId] || 0;
      const completed = completedMap[`${e.userId}:${e.courseId}`] || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: e.id,
        student: e.user,
        course: e.course,
        enrolledAt: e.createdAt,
        progress: { total, completed, percentage },
      };
    });
  },
};
