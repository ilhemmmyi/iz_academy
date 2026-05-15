import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MessageService } from '../services/message.service';

export const MessageController = {

  async getContacts(req: AuthRequest, res: Response) {
    try {
      const contacts = await MessageService.getContacts(req.user!.userId, req.user!.role);
      res.json(contacts);
    } catch {
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      const messages = await MessageService.getConversations(req.user!.userId);
      res.json(messages);
    } catch {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  },

  async send(req: AuthRequest, res: Response) {
    try {
      const { receiverId, content } = req.body;
      const message = await MessageService.send(req.user!.userId, receiverId, content);
      res.status(201).json(message);
    } catch {
      res.status(500).json({ message: 'Failed to send message' });
    }
  },

  async markRead(req: AuthRequest, res: Response) {
    try {
      await MessageService.markRead(String(req.params.id));
      res.json({ message: 'Marked as read' });
    } catch {
      res.status(500).json({ message: 'Failed to mark message as read' });
    }
  },

  async markAllRead(req: AuthRequest, res: Response) {
    try {
      const { senderId } = req.body;
      if (!senderId) return res.status(400).json({ message: 'senderId is required' });
      await MessageService.markAllRead(req.user!.userId, String(senderId));
      res.json({ message: 'All messages marked as read' });
    } catch {
      res.status(500).json({ message: 'Failed to mark messages as read' });
    }
  },
};
