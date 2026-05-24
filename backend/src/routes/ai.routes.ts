import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getRecommendation } from '../controllers/ai.controller';

export const aiRouter = Router();

// POST /api/ai/recommendation
aiRouter.post('/recommendation', authenticate, getRecommendation);
