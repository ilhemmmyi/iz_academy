import { prisma } from '../config/prisma';
import { uploadToStorage, deleteFromStorage } from '../utils/storage';

export const ResourceService = {

  async getByCourse(courseId: string) {
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

  async delete(id: string, teacherId: string) {
    const resource = await prisma.courseResource.findUnique({
      where: { id },
      include: { course: { select: { teacherId: true } } },
    });
    if (!resource) throw Object.assign(new Error('Resource not found'), { code: 'NOT_FOUND' });
    if (resource.course.teacherId !== teacherId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

    await deleteFromStorage(resource.fileUrl).catch(() => {});
    await prisma.courseResource.delete({ where: { id } });
  },
};
