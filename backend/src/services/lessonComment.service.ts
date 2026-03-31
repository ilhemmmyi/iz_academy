import { prisma } from '../config/prisma';

const commentInclude = {
  author: { select: { id: true, name: true, role: true, avatarUrl: true } },
  replies: {
    include: {
      author: { select: { id: true, name: true, role: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export const LessonCommentService = {

  async getByLesson(lessonId: string) {
    return prisma.lessonComment.findMany({
      where: { lessonId, parentId: null },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
  },

  async create(lessonId: string, authorId: string, content: string) {
    return prisma.lessonComment.create({
      data: { content: content.trim(), lessonId, authorId },
      include: commentInclude,
    });
  },

  async reply(parentId: string, authorId: string, content: string) {
    const parent = await prisma.lessonComment.findUnique({ where: { id: parentId } });
    if (!parent) return null;
    return prisma.lessonComment.create({
      data: {
        content: content.trim(),
        lessonId: parent.lessonId,
        authorId,
        parentId,
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });
  },

  async findById(commentId: string) {
    return prisma.lessonComment.findUnique({ where: { id: commentId } });
  },

  async delete(commentId: string) {
    return prisma.lessonComment.delete({ where: { id: commentId } });
  },

  async getByCourse(courseId: string) {
    return prisma.lessonComment.findMany({
      where: {
        parentId: null,
        lesson: { module: { courseId } },
      },
      include: {
        ...commentInclude,
        lesson: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
