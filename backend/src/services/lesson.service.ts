import { prisma } from '../config/prisma';
import { certificateQueue } from '../queues/certificate.queue';
import { getPresignedUrl } from '../utils/storage';
import { config } from '../config';
import { LessonModel } from '../models/lesson.model';
import { EnrollmentModel } from '../models/enrollment.model';

const LESSON_COMPLETE_THRESHOLD = 1.0;
const COMPLETE_THRESHOLD_EPSILON = 0.001;

/** Shared helper: check if course is fully complete and emit certificate if so. */
async function checkAndIssueCertificate(userId: string, lessonId: string) {
  const lesson = await LessonModel.findById(lessonId);
  if (!lesson?.module?.courseId) return;
  const courseId = lesson.module.courseId;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { include: { lessons: true } } },
  });
  if (!course) return;
  const total = course.modules.flatMap((m: any) => m.lessons).length;
  const done = await LessonModel.countCompleted(userId, courseId);
  if (done >= total) {
    certificateQueue.add('issue', { userId, courseId }).catch((err) =>
      console.error('Certificate queue error:', err)
    );
  }
}

export const LessonService = {

  async completeLesson(lessonId: string, userId: string) {
    console.log(`[Backend Complete API] Manual complete called for lesson ${lessonId}, userId: ${userId}`);
    await LessonModel.upsertProgress(userId, lessonId, {
      completed: true,
      completedAt: new Date(),
    });
    console.log(`[Backend Complete API] Lesson ${lessonId} marked completed`);
    await checkAndIssueCertificate(userId, lessonId);
  },

  async getProgress(lessonId: string, userId: string) {
    const progress = await LessonModel.getProgress(userId, lessonId);
    const result = {
      completed: progress?.completed || false,
      watchedSeconds: progress?.watchedSeconds || 0,
      durationSeconds: progress?.durationSeconds || 0,
    };
    console.log(`[Backend Get Progress] Lesson ${lessonId}, Completed: ${result.completed}, Watched: ${result.watchedSeconds}s / ${result.durationSeconds}s`);
    return result;
  },

  async saveVideoProgress(lessonId: string, userId: string, watchedSeconds: number, durationSeconds: number) {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      const err: any = new Error('Lesson not found');
      err.status = 404;
      throw err;
    }

    const progress = await LessonModel.getProgress(userId, lessonId);
    const normalizedWatched = Math.max(0, watchedSeconds);
    const normalizedDuration = Math.max(0, durationSeconds);
    let maxWatchedSeconds = Math.max(progress?.watchedSeconds || 0, normalizedWatched);
    if (normalizedDuration > 0) {
      maxWatchedSeconds = Math.min(maxWatchedSeconds, normalizedDuration);
    }

    const updateData: {
      watchedSeconds: number;
      durationSeconds: number;
      completed?: boolean;
      completedAt?: Date;
    } = {
      watchedSeconds: maxWatchedSeconds,
      durationSeconds: normalizedDuration,
    };

    const watchedRatio = normalizedDuration > 0 ? maxWatchedSeconds / normalizedDuration : 0;
    const shouldComplete = watchedRatio + COMPLETE_THRESHOLD_EPSILON >= LESSON_COMPLETE_THRESHOLD;
    const isNewCompletion = shouldComplete && !progress?.completed;
    console.log(`[Backend Progress] LessonId: ${lessonId}, UserId: ${userId}, Watched: ${maxWatchedSeconds.toFixed(1)}s, Duration: ${normalizedDuration.toFixed(1)}s, Ratio: ${watchedRatio.toFixed(3)}, Threshold: ${LESSON_COMPLETE_THRESHOLD}, ShouldComplete: ${shouldComplete}, AlreadyCompleted: ${progress?.completed || false}`);
    if (shouldComplete) {
      updateData.completed = true;
      if (isNewCompletion) updateData.completedAt = new Date();
      console.log(`[Backend Complete] Marking lesson ${lessonId} as COMPLETED`);
    }

    await LessonModel.upsertProgress(userId, lessonId, updateData);
    console.log(`[Backend Progress Saved] Lesson ${lessonId} progress upserted`);

    // Persist the real video duration on the Lesson row so future progress
    // calculations can use it without relying on individual LessonProgress records
    if (normalizedDuration > 0 && normalizedDuration > (lesson.durationSeconds ?? 0)) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { durationSeconds: normalizedDuration },
      }).catch(() => {}); // non-fatal
    }
    // If newly completed via video progress, also check certificate eligibility
    if (isNewCompletion) {
      checkAndIssueCertificate(userId, lessonId).catch((err) =>
        console.error('Certificate check error from saveVideoProgress:', err)
      );
    }
  },

  async canUnlock(lessonId: string, userId: string) {
    const prevLesson = await LessonModel.findPreviousGlobal(lessonId);
    if (prevLesson === undefined) return null; // lesson not found
    if (prevLesson === null) return true;      // first lesson → always accessible

    const prevProgress = await LessonModel.getProgress(userId, prevLesson.id);
    if (!prevProgress?.completed) return false;

    // Previous lesson has a quiz → student must have passed it
    if (prevLesson.quizId) {
      const bestAttempt = await prisma.quizAttempt.findFirst({
        where: { userId, quizId: prevLesson.quizId },
        orderBy: { score: 'desc' },
      });
      if (!bestAttempt || bestAttempt.score < config.quizPassThreshold) return false;
    }

    return true;
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

        // Enforce sequential quiz progression lock
        const canAccess = await LessonService.canUnlock(lessonId, userId);
        if (!canAccess) throw new Error('QUIZ_REQUIRED');
      }
    }

    const marker = `/object/public/${config.supabase.storageBucket}/`;
    const markerIdx = lesson.videoUrl.indexOf(marker);
    if (markerIdx === -1) return lesson.videoUrl;

    const key = lesson.videoUrl.slice(markerIdx + marker.length);
    return getPresignedUrl(key, 7200);
  },
};

