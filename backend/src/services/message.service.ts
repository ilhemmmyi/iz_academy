import { prisma } from '../config/prisma';
import { EnrollmentModel } from '../models/enrollment.model';
import { ActivityService } from './activity.service';

export const MessageService = {
  getConversations: (userId: string) =>
    prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

  /**
   * Returns the list of people the user can message:
   * - STUDENT → teachers of approved enrolled courses
   * - TEACHER → students enrolled (APPROVED) in their courses
   */
  async getContacts(userId: string, role: string) {
    if (role === 'STUDENT') {
      const enrollments = await EnrollmentModel.findStudentTeachers(userId);
      // Deduplicate teachers
      const seen = new Set<string>();
      return enrollments
        .map((e) => ({ ...e.course.teacher, courseTitle: e.course.title, courseId: e.course.id }))
        .filter((t) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
    }

    if (role === 'TEACHER') {
      const courses = await prisma.course.findMany({
        where: { teacherId: userId },
        select: { id: true, title: true },
      });
      const courseIds = courses.map((c) => c.id);
      const enrollments = await EnrollmentModel.findByCourseIdsForContacts(courseIds);
      const seen = new Set<string>();
      return enrollments
        .map((e) => ({ ...e.user, courseTitle: e.course.title, courseId: e.courseId }))
        .filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
    }

    return [];
  },

  send: async (senderId: string, receiverId: string, content: string) => {
    const message = await prisma.message.create({ data: { senderId, receiverId, content } });
    // If sender is a teacher, create an activity for the student receiver
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, role: true },
    });
    if (sender?.role === 'TEACHER') {
      ActivityService.create(
        receiverId,
        'MESSAGE',
        `${sender.name} vous a envoyé un message`,
        '/student/messages',
      ).catch(() => {});
    }
    return message;
  },

  markRead: (messageId: string) =>
    prisma.message.update({ where: { id: messageId }, data: { read: true } }),

  markAllRead: (receiverId: string, senderId: string) =>
    prisma.message.updateMany({
      where: { receiverId, senderId, read: false },
      data: { read: true },
    }),
};

