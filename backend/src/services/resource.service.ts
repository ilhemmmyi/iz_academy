import { prisma } from '../config/prisma';
import { uploadToStorage, deleteFromStorage } from '../utils/storage';
import { assertActiveEnrollment } from '../utils/enrollmentGuard';

export const ResourceService = {

  async getByCourse(courseId: string, userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      // admins can always read
    } else if (userRole === 'TEACHER') {
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
      if (!course || course.teacherId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    } else {
      await assertActiveEnrollment(userId, courseId);
    }
    return prisma.courseResource.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(courseId: string, teacherId: string, title: string, file: Express.Multer.File) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
    if (!course) throw Object.assign(new Error('Course not found'), { code: 'NOT_FOUND' });
    if (course.teacherId !== teacherId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

    const fileUrl = await uploadToStorage(file.buffer, file.mimetype, 'resources');
    return prisma.courseResource.create({
      data: { title: title.trim(), fileUrl, fileType: file.mimetype, courseId },
    });
  },

  async delete(id: string, requesterId: string, requesterRole: string) {
    const resource = await prisma.courseResource.findUnique({
      where: { id },
      include: { course: { select: { teacherId: true } } },
    });
    if (!resource) throw Object.assign(new Error('Resource not found'), { code: 'NOT_FOUND' });
    if (requesterRole !== 'ADMIN' && resource.course.teacherId !== requesterId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }
    await deleteFromStorage(resource.fileUrl).catch(() => {});
    await prisma.courseResource.delete({ where: { id } });
  },
};
