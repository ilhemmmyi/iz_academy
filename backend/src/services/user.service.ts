import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { UserModel, toSafeUser } from '../models/user.model';
import { CertificateModel } from '../models/certificate.model';
import { ProjectModel } from '../models/project.model';
import { certificateQueue } from '../queues/certificate.queue';
import { uploadToStorage, deleteFromStorage } from '../utils/storage';
import { buildCertificatePdf } from '../utils/certificate';
import {
  calculateCourseProgressPercentage,
  getLessonProgressPercentage,
  getCertificateProgressPercentage,
  getProjectProgressPercentage,
} from '../utils/courseProgress';

export const UserService = {

  async getMe(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
    return toSafeUser(user);
  },

  async updateMe(userId: string, data: { name?: string; avatarUrl?: string }) {
    const user = await UserModel.update(userId, data);
    return toSafeUser(user);
  },

  async completeCoach(userId: string) {
    const user = await UserModel.update(userId, { hasCompletedCoach: true });
    return toSafeUser(user);
  },

  async getAll() {
    const users = await UserModel.findAll();
    return users.map(toSafeUser);
  },

  async deleteUser(id: string, adminId: string) {
    // Gather courses taught by this user (relevant for TEACHERs)
    const courses = await prisma.course.findMany({
      where: { teacherId: id },
      select: { id: true },
    });
    const courseIds = courses.map((c) => c.id);

    await prisma.$transaction([
      // 1. Remove the user's own quiz attempts (student path)
      prisma.quizAttempt.deleteMany({ where: { userId: id } }),
      // 2. Remove the user's own messages, certificates & payments
      prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      CertificateModel.deleteByUser(id),
      prisma.payment.deleteMany({ where: { userId: id } }),
      // 3. Nullify contact-message replies authored by this user
      prisma.contactMessage.updateMany({ where: { repliedById: id }, data: { repliedById: null } }),
      // 4. Reassign teacher's courses to the admin instead of deleting them
      ...(courseIds.length
        ? [prisma.course.updateMany({ where: { teacherId: id }, data: { teacherId: adminId } })]
        : []),
      // 5. Finally delete the user (remaining cascading relations handle the rest)
      prisma.user.delete({ where: { id } }),
    ]);
  },

  async createUser(data: {
    name: string;
    email: string;
    role: 'STUDENT' | 'TEACHER';
    formation?: string;
    duree?: string;
    dateDebut?: string;
  }) {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) throw Object.assign(new Error('Email already in use'), { code: 'CONFLICT' });

    const words = ['Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'Lima', 'Oscar', 'Sierra'];
    const symbols = ['!', '@', '#', '$', '&', '*'];
    const plainPassword =
      words[Math.floor(Math.random() * words.length)] +
      Math.floor(1000 + Math.random() * 9000) +
      symbols[Math.floor(Math.random() * symbols.length)];

    const hashed = await bcrypt.hash(plainPassword, 12);
    const user = await UserModel.create({ ...data, password: hashed });
    return { ...toSafeUser(user), generatedPassword: plainPassword };
  },

  async updateUser(id: string, data: Record<string, unknown>) {
    const user = await UserModel.update(id, data);
    return toSafeUser(user);
  },

  async resetPassword(id: string) {
    const words = ['Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'Lima', 'Oscar', 'Sierra'];
    const symbols = ['!', '@', '#', '$', '&', '*'];
    const plainPassword =
      words[Math.floor(Math.random() * words.length)] +
      Math.floor(1000 + Math.random() * 9000) +
      symbols[Math.floor(Math.random() * symbols.length)];
    const hashed = await bcrypt.hash(plainPassword, 12);
    await UserModel.update(id, { password: hashed });
    return { generatedPassword: plainPassword };
  },

  async getMyCertificates(userId: string) {
    return CertificateModel.findByUser(userId);
  },

  async getCertificateById(id: string, userId: string) {
    const cert = await CertificateModel.findById(id, userId);
    if (!cert) throw Object.assign(new Error('Certificate not found'), { code: 'NOT_FOUND' });
    return cert;
  },

  async buildCertificatePdfBuffer(id: string, userId: string) {
    const cert = await CertificateModel.findByIdForPdf(id, userId);
    if (!cert) throw Object.assign(new Error('Certificate not found'), { code: 'NOT_FOUND' });

    const tutorName = (cert.course as any)?.teacher?.name ?? 'IZ Academy';
    const pdfBuffer = await buildCertificatePdf(
      (cert.user as any).name,
      (cert.course as any).title,
      tutorName,
      cert.id,
      cert.issuedAt,
    );
    return { pdfBuffer, certId: cert.id };
  },

  async retryCertificate(userId: string, courseId: string) {
    const validated = await ProjectModel.findValidatedSubmission(userId, courseId);
    if (!validated) throw Object.assign(new Error('No validated project'), { code: 'FORBIDDEN' });
    await certificateQueue.add('generate', { userId, courseId });
  },

  async assignCourses(teacherId: string, courseIds: string[]) {
    await prisma.course.updateMany({
      where: { id: { in: courseIds } },
      data: { teacherId },
    });
  },

  async removeStudentCourseAccess(studentId: string, courseId: string) {
    await prisma.$transaction([
      // Delete all lesson progress for this student in this course
      prisma.lessonProgress.deleteMany({
        where: {
          userId: studentId,
          lesson: { module: { courseId } },
        },
      }),
      // Delete quiz attempts for quizzes belonging to this course
      prisma.quizAttempt.deleteMany({
        where: {
          userId: studentId,
          quiz: { lessons: { some: { module: { courseId } } } },
        },
      }),
      // Delete the enrollment itself
      prisma.enrollment.deleteMany({
        where: { userId: studentId, courseId },
      }),
    ]);
    console.log(`[Admin] Removed access + progress for user ${studentId} on course ${courseId}`);
  },

  /**
   * Admin view of a single student: progress per course, project submissions, certificates.
   */

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const url = await uploadToStorage(
      file.buffer,
      file.mimetype,
      'avatars'
    );

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });

    return user;
  },

  async deleteAvatar(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

      if (user?.avatarUrl) {
    await deleteFromStorage(user.avatarUrl); //
  }
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
  },
  async getStudentOverview(studentId: string) {
    const user = await UserModel.findById(studentId);
    if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });

    // All approved enrollments with full course + lesson tree
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: studentId, status: 'APPROVED' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            modules: { include: { lessons: { select: { id: true, durationSeconds: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // All the lesson IDs across those courses
    const allLessonIds = enrollments.flatMap((e) =>
      e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)),
    );

    const totalDurationByCourse = enrollments.reduce<Record<string, number>>((acc, enrollment) => {
      acc[enrollment.course.id] = enrollment.course.modules.reduce(
        (courseAcc, module) => courseAcc + module.lessons.reduce(
          (lessonAcc, lesson) => lessonAcc + (lesson.durationSeconds > 0 ? lesson.durationSeconds : 1),
          0,
        ),
        0,
      );
      return acc;
    }, {});

    // Lesson progress for this student so partial watch progress counts too
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { userId: studentId, lessonId: { in: allLessonIds } },
      select: {
        completed: true,
        watchedSeconds: true,
        durationSeconds: true,
        lesson: { select: { durationSeconds: true, module: { select: { courseId: true } } } },
      },
    });

    const completedByCourse: Record<string, number> = {};
    const watchedDurationByCourse: Record<string, number> = {};
    for (const p of lessonProgress) {
      const cid = p.lesson.module.courseId;
      const lessonDuration = Math.max(p.durationSeconds || 0, p.lesson.durationSeconds || 0, 1);
      const watchedDuration = Math.min(Math.max(p.watchedSeconds || 0, 0), lessonDuration);
      watchedDurationByCourse[cid] = (watchedDurationByCourse[cid] ?? 0) + watchedDuration;
      if (p.completed) {
        completedByCourse[cid] = (completedByCourse[cid] ?? 0) + 1;
      }
    }

    // Project submissions
    const submissions = await prisma.projectSubmission.findMany({
      where: { studentId },
      include: {
        project: { select: { id: true, title: true, courseId: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const submissionStatusByCourse: Record<string, string> = {};
    submissions.forEach((submission) => {
      const courseId = submission.project.courseId;
      if (!(courseId in submissionStatusByCourse)) {
        submissionStatusByCourse[courseId] = submission.status;
      }
    });

    const progressByCourse = enrollments.map((e) => {
      const total = e.course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      const completed = completedByCourse[e.course.id] ?? 0;
      const totalDuration = totalDurationByCourse[e.course.id] ?? 0;
      const watchedDuration = watchedDurationByCourse[e.course.id] ?? 0;
      const lessonProgress = getLessonProgressPercentage({
        completedLessons: completed,
        totalLessons: total,
        watchedDuration,
        totalDuration,
      });
      const projectStatus = submissionStatusByCourse[e.course.id] ?? null;
      return {
        courseId: e.course.id,
        courseTitle: e.course.title,
        thumbnailUrl: e.course.thumbnailUrl,
        total,
        completed,
        percentage: calculateCourseProgressPercentage({
          lessonProgress,
          projectProgress: getProjectProgressPercentage(projectStatus),
          certificateProgress: getCertificateProgressPercentage(projectStatus),
        }),
      };
    });

    // Certificates
    const certificates = await CertificateModel.findByUser(studentId);

    return {
      user: toSafeUser(user),
      progressByCourse,
      submissions,
      certificates,
    };
  },
};
