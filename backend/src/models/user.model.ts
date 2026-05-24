import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const UserModel = {
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findAll: () => prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
  create: (data: { name: string; email: string; password: string; role: 'STUDENT' | 'TEACHER' | 'ADMIN'; formation?: string; duree?: string; dateDebut?: string; mustChangePassword?: boolean }) =>
    prisma.user.create({ data }),
  update: (id: string, data: Prisma.UserUpdateInput) => prisma.user.update({ where: { id }, data }),
  delete: (id: string) => prisma.user.delete({ where: { id } }),
};

// C-1 — Ne jamais exposer les tokens secrets ni les champs sensibles
export const toSafeUser = (user: any) => {
  const {
    password,
    emailVerificationToken,
    emailVerificationExpires,
    resetPasswordToken,
    resetPasswordExpires,
    ...safe
  } = user;
  return safe;
};
