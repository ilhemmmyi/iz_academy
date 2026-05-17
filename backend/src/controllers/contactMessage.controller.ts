import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ContactMessageService } from '../services/contactMessage.service';
import { verifyAccessToken } from '../utils/jwt';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// M-6 — Vérification simplifiée : JWT uniquement, sans requête DB supplémentaire
function hasAuthenticatedSession(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    verifyAccessToken(authHeader.split(' ')[1]);
    return true;
  } catch {
    return false;
  }
}

export const ContactMessageController = {
  async submit(req: Request, res: Response) {
    try {
      if (hasAuthenticatedSession(req)) {
        return res.status(403).json({ message: 'Authenticated users cannot use the contact chat' });
      }

      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (!EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ message: 'Invalid email address' });
      }

      const created = await ContactMessageService.submit({
        name: String(name),
        email: String(email),
        subject: String(subject),
        message: String(message),
      });

      res.status(201).json({
        id: created.id,
        message: 'Message sent successfully',
      });
    } catch (err) {
      console.error('[contact.submit]', err);
      res.status(500).json({ message: 'Failed to send message' });
    }
  },

  async getAll(_req: AuthRequest, res: Response) {
    try {
      const messages = await ContactMessageService.getAll();
      res.json(messages);
    } catch (err) {
      console.error('[contact.getAll]', err);
      res.status(500).json({ message: 'Failed to fetch contact messages' });
    }
  },

  async markRead(req: AuthRequest, res: Response) {
    try {
      await ContactMessageService.markRead(String(req.params.id));
      res.json({ message: 'Marked as read' });
    } catch (err) {
      console.error('[contact.markRead]', err);
      res.status(500).json({ message: 'Failed to update contact message' });
    }
  },

  async reply(req: AuthRequest, res: Response) {
    try {
      const { replyMessage } = req.body;
      const updated = await ContactMessageService.reply(String(req.params.id), req.user!.userId, String(replyMessage || ''));
      res.json(updated);
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ message: 'Contact message not found' });
      if (err.message === 'EMPTY_REPLY') return res.status(400).json({ message: 'Reply message is required' });
      console.error('[contact.reply] SMTP error:', err.message);
      res.status(500).json({ message: `Réponse sauvegardée mais email non envoyé : ${err.message}` });
    }
  },
};
