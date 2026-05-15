import { z } from 'zod';

export const enrollmentRequestSchema = z.object({
  courseId: z.string().min(1),
  message: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  educationLevel: z.string().max(50).optional(),
  studentStatus: z.string().max(50).optional(),
});

export const enrollmentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
});
