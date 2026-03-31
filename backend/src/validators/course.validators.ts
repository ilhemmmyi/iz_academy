import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().nonnegative().optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  objectives: z.array(z.string()).optional(),
  modules: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
});
