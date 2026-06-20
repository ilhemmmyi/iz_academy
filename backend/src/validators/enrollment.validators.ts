import { z } from 'zod';

export const enrollmentRequestSchema = z.object({
  courseId: z.string().min(1, 'L\'identifiant du cours est requis'),
  message: z.string().max(500, 'Le message ne doit pas dépasser 500 caractères').optional(),
  phone: z.string().max(30, 'Le numéro de téléphone ne doit pas dépasser 30 caractères').optional(),
  address: z.string().max(200, 'L\'adresse ne doit pas dépasser 200 caractères').optional(),
  educationLevel: z.string().max(50, 'Le niveau scolaire ne doit pas dépasser 50 caractères').optional(),
  studentStatus: z.string().max(50, 'Le statut ne doit pas dépasser 50 caractères').optional(),
});

export const enrollmentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING'], { errorMap: () => ({ message: 'Statut invalide' }) }),
});
