import { Worker } from 'bullmq';
import { config } from '../config';
import { prisma } from '../config/prisma';
import { uploadToStorage } from '../utils/storage';
import { buildCertificatePdf } from '../utils/certificate';
import { emailQueue } from '../queues/email.queue';
import { CertificateModel } from '../models/certificate.model';

const certWorker = new Worker('certificates', async (job) => {
  const { userId, courseId } = job.data;

  // ── Defense-in-depth: verify all 4 conditions before doing any work ──────────

  // Condition 1 + 2: fetch course with its lessons
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { name: true } },
      modules: { include: { lessons: { select: { id: true } } } },
    },
  });
  if (!course) throw new Error(`Course not found: ${courseId}`);

  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

  // Condition 1: student has completed every lesson
  const completedCount = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: allLessonIds }, completed: true },
  });
  if (completedCount < allLessonIds.length) {
    throw new Error(
      `Lessons not complete: ${completedCount}/${allLessonIds.length} for user ${userId}`,
    );
  }

  // Condition 2 + 3 + 4: project submitted, teacher-validated, and admin-approved
  const submission = await prisma.projectSubmission.findFirst({
    where: {
      studentId: userId,
      courseId,
      status: 'VALIDATED',      // teacher approved
      adminApproved: true,       // admin gave final authorization
    },
  });
  if (!submission) {
    throw new Error(
      `Certificate conditions not fully met for user ${userId} on course ${courseId}. ` +
      `Either no validated+admin-approved submission exists.`,
    );
  }

  // ── Skip if a complete certificate already exists ────────────────────────────
  const existing = await CertificateModel.findByUserAndCourse(userId, courseId);
  if (existing?.fileUrl) return; // already done — idempotent

  // ── Fetch student record ──────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`User not found: ${userId}`);

  // ── Create DB record first so we have a stable cert.id to embed in the PDF ───
  const certRecord = existing ?? (await CertificateModel.create(userId, courseId));

  const tutorName = (course as any).teacher?.name ?? 'IZ Academy';

  // ── Generate PDF ──────────────────────────────────────────────────────────────
  const pdfBuffer = await buildCertificatePdf(
    user.name,
    course.title,
    tutorName,
    certRecord.id,
    certRecord.issuedAt,
  );

  // ── Upload to Supabase Storage ────────────────────────────────────────────────
  const fileUrl = await uploadToStorage(pdfBuffer, 'application/pdf', 'certificates');

  // ── Persist the URL in DB ─────────────────────────────────────────────────────
  await CertificateModel.updateFileUrl(userId, courseId, fileUrl);

  // ── Send email notification ───────────────────────────────────────────────────
  await emailQueue.add('certificate', {
    email: user.email,
    name: user.name,
    courseName: course.title,
    fileUrl,
  });
}, { connection: { url: config.redisUrl } });

certWorker.on('error', (err) => {
  console.error('[CertWorker] error:', err.message);
});

certWorker.on('failed', (job, err) => {
  console.error('[CertWorker] job ' + job?.id + ' failed:', err.message);
});
