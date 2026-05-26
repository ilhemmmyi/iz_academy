import { prisma } from '../config/prisma';
import { uploadToStorage, deleteFromStorage } from '../utils/storage';
import { assertActiveEnrollment } from '../utils/enrollmentGuard';

export const LessonResourceService = {

  async getByLesson(lessonId: string, userId: string, userRole: string) {
    await LessonResourceService._checkReadAccess(lessonId, userId, userRole);
    return prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async createFile(lessonId: string, requesterId: string, requesterRole: string, title: string, file: Express.Multer.File) {
    await LessonResourceService._checkAccess(lessonId, requesterId, requesterRole);
    const url = await uploadToStorage(file.buffer, file.mimetype, 'lesson-resources');
    return prisma.lessonResource.create({
      data: { title: title.trim(), type: 'FILE', url, lessonId },
    });
  },

  async createLink(lessonId: string, requesterId: string, requesterRole: string, title: string, url: string) {
    await LessonResourceService._checkAccess(lessonId, requesterId, requesterRole);
    if (!url?.startsWith('http')) throw Object.assign(new Error('Invalid URL'), { code: 'VALIDATION' });
    return prisma.lessonResource.create({
      data: { title: title.trim(), type: 'LINK', url: url.trim(), lessonId },
    });
  },

  async delete(id: string, requesterId: string, requesterRole: string) {
    const resource = await prisma.lessonResource.findUnique({ where: { id } });
    if (!resource) throw Object.assign(new Error('Resource not found'), { code: 'NOT_FOUND' });
    await LessonResourceService._checkAccess(resource.lessonId, requesterId, requesterRole);
    if (resource.type === 'FILE') {
      await deleteFromStorage(resource.url).catch(() => {});
    }
    await prisma.lessonResource.delete({ where: { id } });
  },

  // Internal helper — read access for ADMIN, course teacher, or actively enrolled student
  async _checkReadAccess(lessonId: string, userId: string, userRole: string) {
    if (userRole === 'ADMIN') return;
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: { select: { id: true, teacherId: true } } } } },
    });
    if (!lesson) throw Object.assign(new Error('Lesson not found'), { code: 'NOT_FOUND' });
    if (userRole === 'TEACHER') {
      if (lesson.module.course.teacherId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
      return;
    }
    await assertActiveEnrollment(userId, lesson.module.course.id);
  },

  // Internal helper — verify the requester is ADMIN or teacher of the course owning this lesson
  async _checkAccess(lessonId: string, requesterId: string, requesterRole: string) {
    if (requesterRole === 'ADMIN') return;
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: { select: { teacherId: true } } } } },
    });
    if (!lesson) throw Object.assign(new Error('Lesson not found'), { code: 'NOT_FOUND' });
    if (lesson.module.course.teacherId !== requesterId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }
  },
};
