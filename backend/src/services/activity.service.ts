import { ActivityModel, ActivityTypeVal } from '../models/activity.model';
import { redis } from '../config/redis';
import { withCache } from '../utils/cache';

export const ActivityService = {
  async create(userId: string, type: ActivityTypeVal, message: string, link?: string) {
    const activity = await ActivityModel.create(userId, type, message, link);
    // Bust the per-user cache so the next fetch returns the fresh activity
    try { await redis.del(`activities:${userId}`); } catch {}
    return activity;
  },

  getForUser: (userId: string) =>
    withCache(`activities:${userId}`, () => ActivityModel.findByUser(userId), 60),
};
