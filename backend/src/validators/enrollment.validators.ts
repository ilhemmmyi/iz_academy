import { z } from 'zod';

export const enrollmentRequestSchema = z.object({
  courseId: z.string().min(1),
  message: z.string().max(500).optional(),
});

export const enrollmentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
});
