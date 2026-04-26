import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getRecommendation, getMyCoachData, deleteMyCoachData } from '../controllers/ai.controller';

export const aiRouter = Router();

// GET  /api/ai/my-coach     — fetch saved recommendations
aiRouter.get('/my-coach', authenticate, getMyCoachData);

// DELETE /api/ai/my-coach   — delete saved recommendations (reset)
aiRouter.delete('/my-coach', authenticate, deleteMyCoachData);

// POST /api/ai/recommendation
// Body: JSON — questionnaire only
aiRouter.post('/recommendation', authenticate, getRecommendation);
