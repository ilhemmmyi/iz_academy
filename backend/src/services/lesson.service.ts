import { prisma } from '../config/prisma';
import { certificateQueue } from '../queues/certificate.queue';
import { getPresignedUrl } from '../utils/storage';
import { config } from '../config';
import { LessonModel } from '../models/lesson.model';
import { EnrollmentModel } from '../models/enrollment.model';

export const LessonService = {

  async completeLesson(lessonId: string, userId: string) {
    await LessonModel.upsertProgress(userId, lessonId, {
      completed: true,
      completedAt: new Date(),
    });

    const lesson = await LessonModel.findById(lessonId);

    if (lesson?.module?.courseId) {
      const courseId = lesson.module.courseId;
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { modules: { include: { lessons: true } } },
      });
      if (course) {
        const total = course.modules.flatMap((m: any) => m.lessons).length;
        const done = await LessonModel.countCompleted(userId, courseId);
        if (done >= total) {
          certificateQueue.add('issue', { userId, courseId }).catch((err) =>
            console.error('Certificate queue error:', err)
          );
        }
      }
    }
  },

  async getProgress(lessonId: string, userId: string) {
    const progress = await LessonModel.getProgress(userId, lessonId);
    return {
      completed: progress?.completed || false,
      watchedSeconds: progress?.watchedSeconds || 0,
      durationSeconds: progress?.durationSeconds || 0,
    };
  },

  async saveVideoProgress(lessonId: string, userId: string, watchedSeconds: number, durationSeconds: number) {
    await LessonModel.upsertProgress(userId, lessonId, { watchedSeconds, durationSeconds });
  },

  async canUnlock(lessonId: string, userId: string) {
    const lesson = await LessonModel.findByIdWithModule(lessonId);
    if (!lesson) return null;
    if (lesson.order <= 0) return true;

    const prevLesson = await LessonModel.findPrevious(lesson.moduleId, lesson.order);
    if (!prevLesson) return true;

    const progress = await LessonModel.getProgress(userId, prevLesson.id);
    return progress?.completed === true;
  },

  async getVideoUrl(lessonId: string, userId: string, userRole: string) {
    const lesson = await LessonModel.findById(lessonId);

    if (!lesson?.videoUrl) return null;

    const courseId = lesson.module?.courseId;
    if (courseId) {
      const isTeacher = userRole === 'TEACHER' || userRole === 'ADMIN';
      if (isTeacher) {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.teacherId !== userId) throw new Error('NOT_YOUR_COURSE');
      } else {
        const enrolled = await EnrollmentModel.findApproved(userId, courseId);
        if (!enrolled) throw new Error('NOT_ENROLLED');
      }
    }

    const marker = `/object/public/${config.supabase.storageBucket}/`;
    const markerIdx = lesson.videoUrl.indexOf(marker);
    if (markerIdx === -1) return lesson.videoUrl;

    const key = lesson.videoUrl.slice(markerIdx + marker.length);
    return getPresignedUrl(key, 7200);
  },
};
