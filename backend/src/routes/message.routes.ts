import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { messageLimiter } from '../middlewares/rate-limit.middleware';

export const messageRouter = Router();

messageRouter.get('/contacts', authenticate, MessageController.getContacts);
messageRouter.get('/', authenticate, MessageController.getAll);
messageRouter.post('/', authenticate, messageLimiter, MessageController.send);
messageRouter.put('/mark-all-read', authenticate, MessageController.markAllRead);
messageRouter.put('/:id/read', authenticate, MessageController.markRead);
