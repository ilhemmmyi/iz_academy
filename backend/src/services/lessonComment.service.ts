import { prisma } from '../config/prisma';
import { ActivityService } from './activity.service';

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
    const reply = await prisma.lessonComment.create({
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
    // Notify parent comment author if it's not the same person
    if (parent.authorId !== authorId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: parent.lessonId },
        select: { module: { select: { courseId: true } } },
      });
      const link = lesson?.module?.courseId
        ? `/student/course/${lesson.module.courseId}`
        : '/student';
      ActivityService.create(
        parent.authorId,
        'COMMENT_REPLY',
        `${reply.author.name} a répondu à votre commentaire`,
        link,
      ).catch(() => {});
    }
    return reply;
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
