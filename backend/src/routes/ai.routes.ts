import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getRecommendation } from '../controllers/ai.controller';
import { aiLimiter } from '../middlewares/rate-limit.middleware';

export const aiRouter = Router();

// POST /api/ai/recommendation
aiRouter.post('/recommendation', authenticate, aiLimiter, getRecommendation);
