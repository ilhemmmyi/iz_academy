import { prisma } from '../config/prisma';

export const PaymentService = {
  getAll: () => prisma.payment.findMany({
    where: { user: { role: 'STUDENT' } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  }),

  getByUser: (userId: string) => prisma.payment.findMany({
    where: { userId },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  }),

  create: (userId: string, courseId: string, amount: number) =>
    prisma.payment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, amount, status: 'COMPLETED' },
      update: { amount, status: 'COMPLETED' },
    }),
};
