import { Queue } from 'bullmq';
import { config } from '../config';

export const emailQueue = new Queue('emails', { connection: { url: config.redisUrl } });
