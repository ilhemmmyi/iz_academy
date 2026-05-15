import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LessonCommentService } from '../services/lessonComment.service';

export const LessonCommentController = {

  async getComments(req: AuthRequest, res: Response) {
    try {
      const comments = await LessonCommentService.getByLesson(String(req.params.id));
      res.json(comments);
    } catch {
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  },

  async createComment(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });
      const comment = await LessonCommentService.create(String(req.params.id), req.user!.userId, content);
      res.status(201).json(comment);
    } catch {
      res.status(500).json({ message: 'Failed to create comment' });
    }
  },

  async replyToComment(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });
      const reply = await LessonCommentService.reply(String(req.params.commentId), req.user!.userId, content);
      if (!reply) return res.status(404).json({ message: 'Comment not found' });
      res.status(201).json(reply);
    } catch {
      res.status(500).json({ message: 'Failed to reply' });
    }
  },

  async deleteComment(req: AuthRequest, res: Response) {
    try {
      const commentId = String(req.params.commentId);
      const comment = await LessonCommentService.findById(commentId);
      if (!comment) return res.status(404).json({ message: 'Comment not found' });
      if (comment.authorId !== req.user!.userId && req.user!.role === 'STUDENT') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      await LessonCommentService.delete(commentId);
      res.json({ message: 'Comment deleted' });
    } catch {
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  },

  async getCourseComments(req: AuthRequest, res: Response) {
    try {
      const comments = await LessonCommentService.getByCourse(String(req.params.courseId));
      res.json(comments);
    } catch {
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  },
};
