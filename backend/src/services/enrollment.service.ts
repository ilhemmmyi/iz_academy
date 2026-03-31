import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/email.queue';
import { EnrollmentModel } from '../models/enrollment.model';
import { LessonModel } from '../models/lesson.model';

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
    return enrollment;
  },

  getAll: () => EnrollmentModel.findAll(),

  getByUser: (userId: string) => EnrollmentModel.findByUser(userId),

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
