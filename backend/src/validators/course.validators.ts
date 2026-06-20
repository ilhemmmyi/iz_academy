import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom de la catégorie est requis')
    .max(100, 'Le nom de la catégorie ne doit pas dépasser 100 caractères'),
});

export const createCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne doit pas dépasser 200 caractères'),

  shortDescription: z
    .string()
    .trim()
    .min(1, 'La description courte est requise'),

  longDescription: z
    .string()
    .trim()
    .nullable()
    .optional(),

  price: z
    .number({
      invalid_type_error: 'Le prix doit être un nombre',
    })
    .nonnegative('Le prix ne peut pas être négatif')
    .optional(),

  thumbnailUrl: z
    .string()
    .url('L\'URL de la miniature doit être valide')
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
      z.string().trim().min(1, 'L\'objectif ne peut pas être vide')
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