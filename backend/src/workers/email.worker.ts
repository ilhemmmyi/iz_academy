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
  }
}, { connection: { url: config.redisUrl } });

emailWorker.on('error', (err) => {
  console.error('[EmailWorker] error:', err.message);
});
