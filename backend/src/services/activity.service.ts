import { ActivityModel, ActivityTypeVal } from '../models/activity.model';

export const ActivityService = {
  create: (userId: string, type: ActivityTypeVal, message: string, link?: string) =>
    ActivityModel.create(userId, type, message, link),

  getForUser: (userId: string) =>
    ActivityModel.findByUser(userId),
};
