import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LessonCommentService } from '../services/lessonComment.service';

export const LessonCommentController = {

  async getComments(req: AuthRequest, res: Response) {
    try {
      const comments = await LessonCommentService.getByLesson(String(req.params.id));
      res.json(comments);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des commentaires' });
    }
  },

  async createComment(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ message: 'Le contenu est requis' });
      const comment = await LessonCommentService.create(String(req.params.id), req.user!.userId, content);
      res.status(201).json(comment);
    } catch {
      res.status(500).json({ message: 'Failed to create comment' });
    }
  },

  async replyToComment(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ message: 'Le contenu est requis' });
      const reply = await LessonCommentService.reply(String(req.params.commentId), req.user!.userId, content);
      if (!reply) return res.status(404).json({ message: 'Commentaire introuvable' });
      res.status(201).json(reply);
    } catch {
      res.status(500).json({ message: 'Échec de la réponse' });
    }
  },

  async deleteComment(req: AuthRequest, res: Response) {
    try {
      const commentId = String(req.params.commentId);
      const comment = await LessonCommentService.findById(commentId);
      if (!comment) return res.status(404).json({ message: 'Commentaire introuvable' });
      if (comment.authorId !== req.user!.userId && req.user!.role === 'STUDENT') {
        return res.status(403).json({ message: 'Accès refusé' });
      }
      await LessonCommentService.delete(commentId);
      res.json({ message: 'Comment deleted' });
    } catch {
      res.status(500).json({ message: 'Échec de la suppression du commentaire' });
    }
  },

  async getCourseComments(req: AuthRequest, res: Response) {
    try {
      const comments = await LessonCommentService.getByCourse(String(req.params.courseId));
      res.json(comments);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des commentaires' });
    }
  },

  async getTeacherComments(req: AuthRequest, res: Response) {
    try {
      const comments = await LessonCommentService.getByTeacher(req.user!.userId);
      res.json(comments);
    } catch {
      res.status(500).json({ message: 'Échec de la récupération des commentaires' });
    }
  },
};
