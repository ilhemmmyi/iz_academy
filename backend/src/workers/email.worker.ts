import { Worker } from 'bullmq';
import { config } from '../config';
import { EmailService } from '../utils/email';
import { emailQueue } from '../queues/email.queue';
import { prisma } from '../config/prisma';

const emailWorker = new Worker('emails', async (job) => {
  switch (job.name) {

    case 'welcome':
      await EmailService.sendWelcome(job.data.email, job.data.name);
      break;

    case 'verification-email':
      await EmailService.sendVerificationEmail(job.data);
      break;

    case 'password-reset':
      await EmailService.sendPasswordResetEmail(job.data);
      break;

    case 'enrollment-status':
      await EmailService.sendEnrollmentStatus(job.data);
      break;

    case 'certificate':
      await EmailService.sendCertificate(job.data);
      break;

    case 'contact-notification':
      await EmailService.sendContactNotification(job.data);
      break;

    case 'contact-reply':
      await EmailService.sendContactReply(job.data);
      break;

    case 'teacher-created':
      await EmailService.sendTeacherCreated(job.data);
      break;

    // ── Fan-out : un seul job méta → N jobs individuels ──────────────────────
    // Chaque étudiant a son propre job avec son propre retry.
    // Le jobId par étudiant empêche les doublons si le job méta est retraité.
    case 'course-published': {
      const { courseId, courseTitle, courseDescription, frontendUrl } = job.data;

      const students = await prisma.user.findMany({
        where: { role: 'STUDENT', isVerified: true },
        select: { email: true, name: true },
      });

      if (students.length === 0) break;

      await emailQueue.addBulk(
        students.map(s => ({
          name: 'course-published-user',
          data: { email: s.email, name: s.name, courseTitle, courseDescription, courseId, frontendUrl },
          opts: { jobId: `course-published:${courseId}:${s.email}` },
        })),
      );

      console.log(`[EmailWorker] course-published: ${students.length} jobs queued for course ${courseId}`);
      break;
    }

    // ── Envoi unitaire : un email pour un étudiant ────────────────────────────
    case 'course-published-user':
      await EmailService.sendNewCoursePublished(job.data);
      break;

    default:
      console.warn(`[EmailWorker] Unknown job name: ${job.name}`);
  }
}, { connection: { url: config.redisUrl } });

emailWorker.on('error', (err) => {
  console.error('[EmailWorker] Worker error:', err.message);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job "${job?.name}" (id: ${job?.id}) failed:`, err.message);
});

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job "${job.name}" (id: ${job.id}) completed`);
});
