import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const activityRouter = Router();

activityRouter.get('/me', authenticate, ActivityController.getMyActivities);
