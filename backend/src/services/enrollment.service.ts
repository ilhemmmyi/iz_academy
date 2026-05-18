import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/email.queue';
import { EnrollmentModel } from '../models/enrollment.model';
import { ActivityModel } from '../models/activity.model';
import { withCache } from '../utils/cache';
import {
  calculateCourseProgressPercentage,
  getLessonProgressPercentage,
  getCertificateProgressPercentage,
  getProjectProgressPercentage,
} from '../utils/courseProgress';

export const EnrollmentService = {

  async request(
    userId: string,
    courseId: string,
    message?: string,
    extraInfo?: { phone?: string; address?: string; educationLevel?: string; studentStatus?: string },
  ) {
    const existing = await EnrollmentModel.findByUserAndCourse(userId, courseId);
    if (existing) throw new Error('ALREADY_ENROLLED');
    return EnrollmentModel.create(userId, courseId, message, extraInfo);
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
      // Copy extra info from enrollment to user profile
      const profileUpdate: Record<string, string> = {};
      if ((enrollment as any).phone)          profileUpdate.phone          = (enrollment as any).phone;
      if ((enrollment as any).address)        profileUpdate.address        = (enrollment as any).address;
      if ((enrollment as any).educationLevel) profileUpdate.educationLevel = (enrollment as any).educationLevel;
      if ((enrollment as any).studentStatus)  profileUpdate.studentStatus  = (enrollment as any).studentStatus;
      if (Object.keys(profileUpdate).length > 0) {
        await prisma.user.update({ where: { id: enrollment.userId }, data: profileUpdate });
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

  async delete(id: string) {
    // Fetch the enrollment first so we know user + course to wipe progress
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      select: { userId: true, courseId: true },
    });
    if (!enrollment) return prisma.enrollment.delete({ where: { id } }); // let it throw naturally if not found

    return prisma.$transaction([
      // Delete all lesson progress for this student in this course
      prisma.lessonProgress.deleteMany({
        where: {
          userId: enrollment.userId,
          lesson: { module: { courseId: enrollment.courseId } },
        },
      }),
      // Delete quiz attempts belonging to this course
      prisma.quizAttempt.deleteMany({
        where: {
          userId: enrollment.userId,
          quiz: { lessons: { some: { module: { courseId: enrollment.courseId } } } },
        },
      }),
      // Delete the enrollment itself
      prisma.enrollment.delete({ where: { id } }),
    ]);
  },

  async getByUser(userId: string) {
    const enrollments = await EnrollmentModel.findByUser(userId);

    // Only compute progress for approved enrollments
    const approvedCourseIds = enrollments
      .filter(e => e.status === 'APPROVED')
      .map(e => e.courseId);

    if (approvedCourseIds.length === 0) return enrollments.map(e => ({ ...e, progress: null }));

    // All four data fetches are independent of each other — run in parallel
    const [courses, lessonProgress, submissions, certificates] = await Promise.all([
      prisma.course.findMany({
        where: { id: { in: approvedCourseIds } },
        include: { modules: { include: { lessons: { select: { id: true, durationSeconds: true } } } } },
      }),
      prisma.lessonProgress.findMany({
        where: {
          userId,
          lesson: { module: { courseId: { in: approvedCourseIds } } },
        },
        select: {
          completed: true,
          watchedSeconds: true,
          durationSeconds: true,
          lesson: { select: { durationSeconds: true, module: { select: { courseId: true } } } },
        },
      }),
      prisma.projectSubmission.findMany({
        where: { studentId: userId, courseId: { in: approvedCourseIds } },
        select: { courseId: true, status: true },
      }),
      prisma.certificate.findMany({
        where: { userId, courseId: { in: approvedCourseIds } },
        select: { id: true, courseId: true, fileUrl: true },
      }),
    ]);

    const totalLessonsMap: Record<string, number> = {};
    const totalDurationMap: Record<string, number> = {};
    courses.forEach(c => {
      totalLessonsMap[c.id] = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      // Use durationSeconds if set; fall back to 1s per lesson so courses without
      // durations still produce a sensible 0–100% range (guarded against div/0)
      totalDurationMap[c.id] = c.modules.reduce(
        (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.durationSeconds > 0 ? l.durationSeconds : 1), 0), 0,
      );
    });

    const completedLessonsMap: Record<string, number> = {};
    const watchedDurationMap: Record<string, number> = {};
    lessonProgress.forEach(p => {
      const cId = p.lesson.module.courseId;
      const lessonDuration = Math.max(p.durationSeconds || 0, p.lesson.durationSeconds || 0, 1);
      const watchedDuration = Math.min(Math.max(p.watchedSeconds || 0, 0), lessonDuration);
      watchedDurationMap[cId] = (watchedDurationMap[cId] || 0) + watchedDuration;
      if (p.completed) {
        completedLessonsMap[cId] = (completedLessonsMap[cId] || 0) + 1;
      }
    });

    const submissionMap: Record<string, string> = {};
    submissions.forEach(s => { submissionMap[s.courseId] = s.status; });

    const certMap: Record<string, { id: string; fileUrl: string | null }> = {};
    certificates.forEach(c => { certMap[c.courseId] = { id: c.id, fileUrl: c.fileUrl }; });

    return enrollments.map(e => {
      if (e.status !== 'APPROVED') return { ...e, progress: null };

      const totalLessons = totalLessonsMap[e.courseId] || 0;
      const completedLessons = completedLessonsMap[e.courseId] || 0;
      const totalDuration = totalDurationMap[e.courseId] || 0;
      const watchedDuration = watchedDurationMap[e.courseId] || 0;
      const lessonProgress = getLessonProgressPercentage({
        completedLessons,
        totalLessons,
        watchedDuration,
        totalDuration,
      });

      const projectStatus = submissionMap[e.courseId] ?? null;
      const percentage = calculateCourseProgressPercentage({
        lessonProgress,
        projectProgress: getProjectProgressPercentage(projectStatus),
        certificateProgress: getCertificateProgressPercentage(projectStatus),
      });

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
      include: { modules: { include: { lessons: { select: { id: true, durationSeconds: true } } } } },
    });

    const courseIds = courses.map(c => c.id);
    const totalLessonsMap: Record<string, number> = {};
    const totalDurationMap: Record<string, number> = {};
    courses.forEach(c => {
      totalLessonsMap[c.id] = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      totalDurationMap[c.id] = c.modules.reduce(
        (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.durationSeconds > 0 ? l.durationSeconds : 1), 0), 0,
      );
    });

    // Get approved enrollments for those courses
    const enrollments = await EnrollmentModel.findApprovedByCourseIds(courseIds);

    // Fetch lesson progress for all enrolled students so partial watch progress counts too
    const studentIds = [...new Set(enrollments.map(e => e.userId))];
    const allProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: { in: studentIds },
        lesson: { module: { courseId: { in: courseIds } } },
      },
      select: {
        userId: true,
        completed: true,
        watchedSeconds: true,
        durationSeconds: true,
        lesson: { select: { durationSeconds: true, module: { select: { courseId: true } } } },
      },
    });

    // Group lesson progress by userId+courseId
    const completedMap: Record<string, number> = {};
    const watchedDurationMap: Record<string, number> = {};
    allProgress.forEach(p => {
      const key = `${p.userId}:${p.lesson.module.courseId}`;
      const lessonDuration = Math.max(p.durationSeconds || 0, p.lesson.durationSeconds || 0, 1);
      const watchedDuration = Math.min(Math.max(p.watchedSeconds || 0, 0), lessonDuration);
      watchedDurationMap[key] = (watchedDurationMap[key] || 0) + watchedDuration;
      if (p.completed) {
        completedMap[key] = (completedMap[key] || 0) + 1;
      }
    });

    const submissions = await prisma.projectSubmission.findMany({
      where: { studentId: { in: studentIds }, courseId: { in: courseIds } },
      select: { studentId: true, courseId: true, status: true },
    });
    const submissionMap: Record<string, string> = {};
    submissions.forEach((submission) => {
      submissionMap[`${submission.studentId}:${submission.courseId}`] = submission.status;
    });

    return enrollments.map(e => {
      const total = totalLessonsMap[e.courseId] || 0;
      const completed = completedMap[`${e.userId}:${e.courseId}`] || 0;
      const totalDuration = totalDurationMap[e.courseId] || 0;
      const watchedDuration = watchedDurationMap[`${e.userId}:${e.courseId}`] || 0;
      const lessonProgress = getLessonProgressPercentage({
        completedLessons: completed,
        totalLessons: total,
        watchedDuration,
        totalDuration,
      });
      const projectStatus = submissionMap[`${e.userId}:${e.courseId}`] ?? null;
      const percentage = calculateCourseProgressPercentage({
        lessonProgress,
        projectProgress: getProjectProgressPercentage(projectStatus),
        certificateProgress: getCertificateProgressPercentage(projectStatus),
      });
      return {
        id: e.id,
        student: e.user,
        course: e.course,
        enrolledAt: e.createdAt,
        progress: { total, completed, percentage },
      };
    });
  },

  /**
   * Returns per-day watched seconds for the last `days` days (today first).
   * Aggregates across ALL enrolled courses for this user.
   * Single DB query instead of one-per-day loop; result cached for 60 s.
   */
  async getWatchStats(userId: string, days = 10) {
    return withCache(`watch-stats:${userId}:${days}`, async () => {
      const now = new Date();
      const rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);

      // Single query: all lesson progress records updated within the window
      const records = await prisma.lessonProgress.findMany({
        where: { userId, updatedAt: { gte: rangeStart } },
        select: { watchedSeconds: true, updatedAt: true },
      });

      // Aggregate in-memory by calendar day (same semantics as the old per-day aggregate)
      const secByDay: Record<string, number> = {};
      records.forEach(r => {
        const label = new Date(r.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        secByDay[label] = (secByDay[label] ?? 0) + (r.watchedSeconds ?? 0);
      });

      // Build result array: index 0 = today, index 1 = yesterday, …
      const result: { day: string; seconds: number }[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        result.push({ day: label, seconds: secByDay[label] ?? 0 });
      }
      return result;
    }, 60); // 60 s TTL — chart is approximate, short staleness is fine
  },
};
