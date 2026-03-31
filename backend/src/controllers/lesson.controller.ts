import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LessonService } from '../services/lesson.service';

export const LessonController = {

  async completeLesson(req: AuthRequest, res: Response) {
    try {
      await LessonService.completeLesson(String(req.params.id), req.user!.userId);
      res.json({ message: 'Lesson completed' });
    } catch {
      res.status(500).json({ message: 'Failed to complete lesson' });
    }
  },

  async getProgress(req: AuthRequest, res: Response) {
    try {
      const result = await LessonService.getProgress(String(req.params.id), req.user!.userId);
      res.json(result);
    } catch {
      res.status(500).json({ message: 'Failed to fetch progress' });
    }
  },

  async saveVideoProgress(req: AuthRequest, res: Response) {
    try {
      const { watchedSeconds, durationSeconds } = req.body;
      if (typeof watchedSeconds !== 'number' || typeof durationSeconds !== 'number') {
        return res.status(400).json({ message: 'watchedSeconds and durationSeconds are required numbers' });
      }
      await LessonService.saveVideoProgress(String(req.params.id), req.user!.userId, watchedSeconds, durationSeconds);
      res.json({ message: 'Video progress saved' });
    } catch {
      res.status(500).json({ message: 'Failed to save video progress' });
    }
  },

  async canUnlock(req: AuthRequest, res: Response) {
    try {
      const result = await LessonService.canUnlock(String(req.params.id), req.user!.userId);
      if (result === null) return res.status(404).json({ message: 'Lesson not found' });
      res.json({ canUnlock: result });
    } catch {
      res.status(500).json({ message: 'Failed to check lesson access' });
    }
  },

  async getVideoUrl(req: AuthRequest, res: Response) {
    try {
      const url = await LessonService.getVideoUrl(String(req.params.id), req.user!.userId, req.user!.role);
      if (url === null) return res.status(404).json({ message: 'No video for this lesson' });
      res.json({ url });
    } catch (err: any) {
      if (err.message === 'NOT_YOUR_COURSE' || err.message === 'NOT_ENROLLED') {
        return res.status(403).json({ message: err.message === 'NOT_YOUR_COURSE' ? 'Not your course' : 'Not enrolled' });
      }
      res.status(500).json({ message: 'Failed to get video URL' });
    }
  },
};

