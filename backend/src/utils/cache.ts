import { redis } from '../config/redis';

const CACHE_TTL = 300;

export const withCache = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch {}
  const result = await fn();
  try { await redis.setex(key, CACHE_TTL, JSON.stringify(result)); } catch {}
  return result;
};
