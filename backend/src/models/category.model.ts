import { prisma } from '../config/prisma';

export const CategoryModel = {

  findAll: () =>
    prisma.category.findMany({ orderBy: { name: 'asc' } }),

  create: (name: string, slug: string) =>
    prisma.category.create({ data: { name, slug } }),

  update: (id: string, name: string, slug: string) =>
    prisma.category.update({
      where: { id },
      data: { name, slug },
    }),

  delete: (id: string) =>
    prisma.category.delete({ where: { id } }),
};
