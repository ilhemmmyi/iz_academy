import { prisma } from '../config/prisma';

export const CertificateModel = {

  findByUserAndCourse: (userId: string, courseId: string) =>
    prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }),

  findByUser: (userId: string) =>
    prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            teacher: { select: { name: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    }),

  findById: (id: string, userId: string) =>
    prisma.certificate.findFirst({
      where: { id, userId },
      include: {
        user: { select: { name: true } },
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            teacher: { select: { name: true } },
          },
        },
      },
    }),

  findByIdForPdf: (id: string, userId: string) =>
    prisma.certificate.findFirst({
      where: { id, userId },
      include: {
        user: { select: { name: true } },
        course: {
          select: {
            title: true,
            teacher: { select: { name: true } },
          },
        },
      },
    }),

  create: (userId: string, courseId: string) =>
    prisma.certificate.create({
      data: { userId, courseId },
    }),

  updateFileUrl: (userId: string, courseId: string, fileUrl: string) =>
    prisma.certificate.update({
      where: { userId_courseId: { userId, courseId } },
      data: { fileUrl },
    }),

  deleteByUser: (userId: string) =>
    prisma.certificate.deleteMany({ where: { userId } }),
};
