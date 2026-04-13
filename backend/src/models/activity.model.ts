import { prisma } from '../config/prisma';

export type ActivityTypeVal = 'COMMENT_REPLY' | 'MESSAGE' | 'PROJECT_UPDATE' | 'ENROLLMENT_APPROVED' | 'CERTIFICATE_ISSUED';

export const ActivityModel = {
  create: (userId: string, type: ActivityTypeVal, message: string, link?: string) =>
    prisma.activity.create({
      data: { userId, type: type as any, message, link },
    }),

  findByUser: (userId: string, take = 20) =>
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    }),
};
