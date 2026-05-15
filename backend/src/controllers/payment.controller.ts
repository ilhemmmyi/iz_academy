import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PaymentService } from '../services/payment.service';
import { prisma } from '../config/prisma';

export const PaymentController = {

  async getAll(_req: AuthRequest, res: Response) {
    try {
      const payments = await PaymentService.getAll();
      res.json(payments);
    } catch {
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  },

  async getMyPayments(req: AuthRequest, res: Response) {
    try {
      const payments = await PaymentService.getByUser(req.user!.userId);
      res.json(payments);
    } catch {
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { courseId } = req.body;
      if (!courseId || typeof courseId !== 'string') {
        return res.status(400).json({ message: 'courseId is required' });
      }
      // Determine price server-side — never trust client-supplied amount
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { price: true } });
      if (!course) return res.status(404).json({ message: 'Course not found' });
      const amount = course.price ?? 0;
      const payment = await PaymentService.create(req.user!.userId, courseId, amount);
      res.status(201).json(payment);
    } catch {
      res.status(500).json({ message: 'Failed to create payment' });
    }
  },
};
