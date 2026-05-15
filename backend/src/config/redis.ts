import Redis from 'ioredis';
import { config } from './index';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));
