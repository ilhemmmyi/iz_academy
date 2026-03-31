import { Queue } from 'bullmq';
import { config } from '../config';

export const certificateQueue = new Queue('certificates', { connection: { url: config.redisUrl } });
