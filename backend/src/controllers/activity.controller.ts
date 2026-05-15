import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ActivityService } from '../services/activity.service';

export const ActivityController = {
  async getMyActivities(req: AuthRequest, res: Response) {
    try {
      const activities = await ActivityService.getForUser(req.user!.userId);
      res.json(activities);
    } catch {
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  },
};
