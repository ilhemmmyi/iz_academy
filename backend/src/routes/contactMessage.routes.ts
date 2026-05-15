import { Router } from 'express';
import { ContactMessageController } from '../controllers/contactMessage.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

export const contactMessageRouter = Router();

contactMessageRouter.post('/', ContactMessageController.submit);
contactMessageRouter.get('/', authenticate, requireRole('ADMIN'), ContactMessageController.getAll);
contactMessageRouter.patch('/:id/read', authenticate, requireRole('ADMIN'), ContactMessageController.markRead);
contactMessageRouter.post('/:id/reply', authenticate, requireRole('ADMIN'), ContactMessageController.reply);