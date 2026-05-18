import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { UserModel, toSafeUser } from '../models/user.model';
import { CertificateModel } from '../models/certificate.model';
import { ProjectModel } from '../models/project.model';
import { certificateQueue } from '../queues/certificate.queue';
import { emailQueue } from '../queues/email.queue';
import { config } from '../config';
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

  async getAll(params: { search?: string; page?: number; limit?: number; role?: string } = {}) {
    const { search, page = 1, limit = 25, role } = params;
    const skip = (page - 1) * limit;
    const roleFilter = role && role !== 'all' ? { role: role.toUpperCase() as any } : {};
    const where = {
      NOT: { role: 'ADMIN' as const },
      ...roleFilter,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };
    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.user.count({ where }),
    ]);
    return { users: rawUsers.map(toSafeUser), total, page, totalPages: Math.ceil(total / limit) };
  },

  async deleteUser(id: string, adminId: string) {
    const courses = await prisma.course.findMany({
      where: { teacherId: id },
      select: { id: true },
    });
    const courseIds = courses.map((c) => c.id);

    await prisma.$transaction([
      prisma.quizAttempt.deleteMany({ where: { userId: id } }),
      prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      CertificateModel.deleteByUser(id),
      prisma.payment.deleteMany({ where: { userId: id } }),
      prisma.contactMessage.updateMany({ where: { repliedById: id }, data: { repliedById: null } }),
      ...(courseIds.length
        ? [prisma.course.updateMany({ where: { teacherId: id }, data: { teacherId: adminId } })]
        : []),
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
    password: string;
  }) {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) throw Object.assign(new Error('Email already in use'), { code: 'CONFLICT' });

    const { password, ...rest } = data;
    const hashed = await bcrypt.hash(password, 12);
    const user = await UserModel.create({ ...rest, password: hashed, mustChangePassword: true });

    // Notify the new teacher by email (fire-and-forget via queue)
    if (rest.role === 'TEACHER') {
      emailQueue.add('teacher-created', {
        email: user.email,
        name: user.name,
        frontendUrl: config.frontendUrl,
      }).catch((err) => console.error('[createUser] Email queue error:', err));
    }

    return toSafeUser(user);
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
    await UserModel.update(id, { password: hashed, mustChangePassword: true });
    return { generatedPassword: plainPassword };
  },

  async changePassword(userId: string, newPassword: string, currentPassword?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });

    if (user.password) {
      // User already has a local password — must verify it before allowing change
      if (!currentPassword) throw Object.assign(new Error('Current password is required'), { code: 'CURRENT_PASSWORD_REQUIRED' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) throw Object.assign(new Error('Current password is incorrect'), { code: 'WRONG_PASSWORD' });
      // Prevent setting the same password
      const same = await bcrypt.compare(newPassword, user.password);
      if (same) throw Object.assign(new Error('New password must differ from current'), { code: 'SAME_PASSWORD' });
    }
    // Google-only user (no local password) or verified current password → persist new password
    const hashed = await bcrypt.hash(newPassword, 12);
    await UserModel.update(userId, { password: hashed, mustChangePassword: false });
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

  async getEligibleCourses(adminId: string, teacherId: string) {
    return prisma.course.findMany({
      where: { OR: [{ teacherId: adminId }, { teacherId }] },
      select: { id: true, title: true, teacherId: true },
      orderBy: { title: 'asc' },
    });
  },

  async assignCourses(adminId: string, teacherId: string, courseIds: string[]) {
    if (courseIds.length > 0) {
      const courses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, teacherId: true },
      });
      const invalid = courses.filter(c => c.teacherId !== adminId && c.teacherId !== teacherId);
      if (invalid.length > 0) {
        console.error('[assignCourses] Blocked: courses belong to another teacher:', invalid.map(c => c.id));
        throw Object.assign(new Error('Some courses are assigned to another teacher'), { code: 'CONFLICT' });
      }
    }

    await prisma.$transaction(async (tx) => {
      // Unassign courses removed from this teacher → fallback to admin
      const unassignWhere = courseIds.length > 0
        ? { teacherId, id: { notIn: courseIds } }
        : { teacherId };
      const unassigned = await tx.course.updateMany({ where: unassignWhere, data: { teacherId: adminId } });
      if (unassigned.count > 0) {
        console.log(`[assignCourses] ${unassigned.count} course(s) reassigned to admin (${adminId})`);
      }

      if (courseIds.length > 0) {
        await tx.course.updateMany({
          where: { id: { in: courseIds } },
          data: { teacherId },
        });
        console.log(`[assignCourses] ${courseIds.length} course(s) assigned to teacher (${teacherId})`);
      }
    });
  },

  async removeStudentCourseAccess(studentId: string, courseId: string) {
    await prisma.$transaction([
      prisma.lessonProgress.deleteMany({
        where: {
          userId: studentId,
          lesson: { module: { courseId } },
        },
      }),
      prisma.quizAttempt.deleteMany({
        where: {
          userId: studentId,
          quiz: { lessons: { some: { module: { courseId } } } },
        },
      }),
      prisma.enrollment.deleteMany({
        where: { userId: studentId, courseId },
      }),
    ]);
    console.log(`[Admin] Removed access + progress for user ${studentId} on course ${courseId}`);
  },

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
      await deleteFromStorage(user.avatarUrl);
    }
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
  },

  async getStudentOverview(studentId: string) {
    const user = await UserModel.findById(studentId);
    if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });

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

    const certificates = await CertificateModel.findByUser(studentId);

    return {
      user: toSafeUser(user),
      progressByCourse,
      submissions,
      certificates,
    };
  },
};
