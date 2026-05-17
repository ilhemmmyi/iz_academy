import { emailQueue } from '../queues/email.queue';

// M-5 — Wrapper qui absorbe les erreurs Redis sans crasher l'application
export async function queueEmail(name: string, data: object): Promise<void> {
  try {
    await emailQueue.add(name, data);
  } catch (err: any) {
    console.error(`[EmailQueue] Impossible d'ajouter le job "${name}":`, err.message);
  }
}
