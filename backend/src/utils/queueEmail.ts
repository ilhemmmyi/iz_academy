import { JobsOptions } from 'bullmq';
import { emailQueue } from '../queues/email.queue';

export async function queueEmail(name: string, data: object, options?: JobsOptions): Promise<void> {
  try {
    await emailQueue.add(name, data, options);
  } catch (err: any) {
    console.error(`[EmailQueue] Impossible d'ajouter le job "${name}":`, err.message);
  }
}
