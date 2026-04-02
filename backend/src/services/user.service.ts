import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { UserModel, toSafeUser } from '../models/user.model';
import { CertificateModel } from '../models/certificate.model';
import { ProjectModel } from '../models/project.model';
import { certificateQueue } from '../queues/certificate.queue';
import { buildCertificatePdf } from '../utils/certificate';

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

  async getAll() {
    const users = await UserModel.findAll();
    return users.map(toSafeUser);
  },

  async deleteUser(id: string) {
    // Gather courses taught by this user (relevant for TEACHERs)
    const courses = await prisma.course.findMany({
      where: { teacherId: id },
      select: { id: true },
    });
    const courseIds = courses.map((c) => c.id);

    // Gather quizzes inside those courses so we can remove their attempts
    const quizIds = courseIds.length
      ? (await prisma.quiz.findMany({ where: { courseId: { in: courseIds } }, select: { id: true } }))
          .map((q) => q.id)
      : [];

    await prisma.$transaction([
      // 1. Remove quiz attempts referencing the teacher's quizzes (no CASCADE)
      ...(quizIds.length
        ? [prisma.quizAttempt.deleteMany({ where: { quizId: { in: quizIds } } })]
        : []),
      // 2. Remove the user's own quiz attempts (student path)
      prisma.quizAttempt.deleteMany({ where: { userId: id } }),
      // 3. Remove payments & certificates tied to the teacher's courses (no CASCADE)
      ...(courseIds.length
        ? [
            prisma.payment.deleteMany({ where: { courseId: { in: courseIds } } }),
            prisma.certificate.deleteMany({ where: { courseId: { in: courseIds } } }),
          ]
        : []),
      // 4. Remove the user's own messages, certificates & payments
      prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      CertificateModel.deleteByUser(id),
      prisma.payment.deleteMany({ where: { userId: id } }),
      // 5. Nullify contact-message replies authored by this user
      prisma.contactMessage.updateMany({ where: { repliedById: id }, data: { repliedById: null } }),
      // 6. Delete the teacher's courses (children cascade via schema)
      ...(courseIds.length
        ? [prisma.course.deleteMany({ where: { id: { in: courseIds } } })]
        : []),
      // 7. Finally delete the user (remaining cascading relations handle the rest)
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

  /**
   * Admin view of a single student: progress per course, project submissions, certificates.
   */
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
            modules: { include: { lessons: { select: { id: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // All the lesson IDs across those courses
    const allLessonIds = enrollments.flatMap((e) =>
      e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)),
    );

    // Completed lesson progress for this student
    const completedProgress = await prisma.lessonProgress.findMany({
      where: { userId: studentId, lessonId: { in: allLessonIds }, completed: true },
      select: { lessonId: true, lesson: { select: { module: { select: { courseId: true } } } } },
    });

    const completedByCourse: Record<string, number> = {};
    for (const p of completedProgress) {
      const cid = p.lesson.module.courseId;
      completedByCourse[cid] = (completedByCourse[cid] ?? 0) + 1;
    }

    const progressByCourse = enrollments.map((e) => {
      const total = e.course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      const completed = completedByCourse[e.course.id] ?? 0;
      return {
        courseId: e.course.id,
        courseTitle: e.course.title,
        thumbnailUrl: e.course.thumbnailUrl,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // Project submissions
    const submissions = await prisma.projectSubmission.findMany({
      where: { studentId },
      include: {
        project: { select: { id: true, title: true, courseId: true } },
      },
      orderBy: { submittedAt: 'desc' },
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
