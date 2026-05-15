import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

export const messageRouter = Router();

const messageLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

messageRouter.get('/contacts', authenticate, MessageController.getContacts);
messageRouter.get('/', authenticate, MessageController.getAll);
messageRouter.post('/', authenticate, messageLimiter, MessageController.send);
messageRouter.put('/mark-all-read', authenticate, MessageController.markAllRead);
messageRouter.put('/:id/read', authenticate, MessageController.markRead);

