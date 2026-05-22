import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { getSettings, updateSetting } from '../controllers/settings.controller';

export const settingsRouter = Router();

// Public — landing page reads this without auth
settingsRouter.get('/', getSettings);

// Admin only — write/update a setting
settingsRouter.patch('/', authenticate, requireRole('ADMIN'), updateSetting);
