import { prisma } from '../config/prisma';

export const EnrollmentModel = {

  findByUserAndCourse: (userId: string, courseId: string) =>
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }),

  findApproved: (userId: string, courseId: string) =>
    prisma.enrollment.findFirst({
      where: { userId, courseId, status: 'APPROVED' },
    }),

  create: (userId: string, courseId: string, message?: string) =>
    prisma.enrollment.create({
      data: { userId, courseId, message, status: 'PENDING' },
    }),

  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    prisma.enrollment.update({
      where: { id },
      data: { status },
      include: { user: true, course: true },
    }),

  findAll: () =>
    prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

  findByUser: (userId: string) =>
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            teacher: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

  findApprovedByCourseIds: (courseIds: string[]) =>
    prisma.enrollment.findMany({
      where: { courseId: { in: courseIds }, status: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

  findStudentTeachers: (userId: string) =>
    prisma.enrollment.findMany({
      where: { userId, status: 'APPROVED' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            teacher: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    }),

  findByCourseIdsForContacts: (courseIds: string[]) =>
    prisma.enrollment.findMany({
      where: { courseId: { in: courseIds }, status: 'APPROVED' },
      include: {
        course: { select: { title: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
};
