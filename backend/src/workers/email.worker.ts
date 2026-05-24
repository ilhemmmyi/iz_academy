import { Worker } from 'bullmq';
import { config } from '../config';
import { EmailService } from '../utils/email';
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

    // ── Publication d'un cours : email à tous les étudiants ──────────────────
    // Le job porte le courseId. Le worker récupère lui-même la liste complète
    // des étudiants pour ne jamais manquer de destinataire.
    // Pas de filtre isVerified : les comptes créés par l'admin doivent
    // aussi recevoir la notification.
    case 'course-published': {
      const { courseId, courseTitle, courseDescription, frontendUrl } = job.data;

      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { email: true, name: true },
      });

      console.log(`[EmailWorker] course-published → ${students.length} étudiant(s) pour le cours "${courseTitle}"`);

      for (const student of students) {
        await EmailService.sendNewCoursePublished({
          email: student.email,
          name: student.name,
          courseTitle,
          courseDescription,
          courseId,
          frontendUrl,
        });
      }
      break;
    }

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
