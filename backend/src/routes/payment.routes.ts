import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

export const paymentRouter = Router();

paymentRouter.get('/', authenticate, requireRole('ADMIN'), PaymentController.getAll);
paymentRouter.get('/me', authenticate, PaymentController.getMyPayments);
paymentRouter.post('/', authenticate, PaymentController.create);
