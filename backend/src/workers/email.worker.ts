import { Worker } from 'bullmq';
import { config } from '../config';
import { EmailService } from '../utils/email';

const emailWorker = new Worker('emails', async (job) => {
  switch (job.name) {
    case 'welcome':
      await EmailService.sendWelcome(job.data.email, job.data.name);
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
    case 'course-published':
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
