import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(100, 'Category name cannot exceed 100 characters'),
});

export const createCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),

  shortDescription: z
    .string()
    .trim()
    .min(1, 'Short description is required'),

  longDescription: z
    .string()
    .trim()
    .nullable()
    .optional(),

  price: z
    .number({
      invalid_type_error: 'Price must be a number',
    })
    .nonnegative('Price cannot be negative')
    .optional(),

  thumbnailUrl: z
    .string()
    .url('Thumbnail URL must be valid')
    .nullable()
    .optional(),

  categoryId: z
    .string()
    .trim()
    .nullable()
    .optional(),

  level: z
    .string()
    .trim()
    .optional(),

  duration: z
    .string()
    .trim()
    .optional(),

  objectives: z
    .array(
      z.string().trim().min(1, 'Objective cannot be empty')
    )
    .optional(),

  modules: z
    .array(z.any())
    .optional(),

  projects: z
    .array(z.any())
    .optional(),

  teacherId: z
    .string()
    .trim()
    .optional(),
});