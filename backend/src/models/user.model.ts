import { prisma } from '../config/prisma';

export const UserModel = {
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findAll: () => prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
  create: (data: { name: string; email: string; password: string; role: 'STUDENT' | 'TEACHER' | 'ADMIN'; formation?: string; duree?: string; dateDebut?: string }) =>
    prisma.user.create({ data }),
  update: (id: string, data: any) => prisma.user.update({ where: { id }, data }),
  delete: (id: string) => prisma.user.delete({ where: { id } }),
};

export const toSafeUser = (user: any) => {
  const { password, twoFactorSecret, ...safe } = user;
  return safe;
};
