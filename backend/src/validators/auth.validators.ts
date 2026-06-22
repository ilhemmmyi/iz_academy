import { z } from 'zod';

// H-2 — Schéma mot de passe unifié (register + reset utilisent les mêmes règles)
const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne doit pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/, 'Le mot de passe doit contenir au moins un caractère spécial');

export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères')
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, 'Le nom ne doit contenir que des lettres'),
  email: z.string().email('Adresse email invalide'),
  password: passwordSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const googleLoginSchema = z.object({
  uid: z.string().min(1, 'uid est requis'),
  email: z.string().email('Adresse email invalide'),
  displayName: z.string().min(1, 'displayName est requis'),
  firebaseToken: z.string().min(1, 'firebaseToken est requis'),
});
