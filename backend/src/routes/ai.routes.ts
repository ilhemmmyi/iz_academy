import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getRecommendation } from '../controllers/ai.controller';
import multer from 'multer';

const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted for CV upload'));
  },
}).single('cv');

export const aiRouter = Router();

// POST /api/ai/recommendation
// Body: multipart/form-data  — questionnaire (JSON string) + optional cv (PDF)
aiRouter.post('/recommendation', authenticate, (req, res, next) => {
  cvUpload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, getRecommendation);
