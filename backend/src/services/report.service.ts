import { prisma } from '../config/prisma';

export const ReportService = {

  async create(reporterId: string, reason: string, messageId?: string, commentId?: string) {
    // Prevent duplicate report from the same user on the same content
    const existing = await prisma.report.findFirst({
      where: {
        reporterId,
        ...(messageId ? { messageId } : { commentId }),
      },
    });
    if (existing) throw new Error('ALREADY_REPORTED');

    return prisma.report.create({
      data: {
        reason: reason.trim(),
        reporterId,
        messageId: messageId ?? null,
        commentId: commentId ?? null,
      },
    });
  },

  async getAll() {
    return prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
        message: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            authorId: true,
            lessonId: true,
            author: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async markReviewed(id: string) {
    return prisma.report.update({
      where: { id },
      data: { status: 'REVIEWED' },
    });
  },
};
