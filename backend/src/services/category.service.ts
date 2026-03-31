import { redis } from '../config/redis';
import { CategoryModel } from '../models/category.model';

const toSlug = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const CategoryService = {
  toSlug,

  async getAll() {
    const cached = await redis.get('categories').catch(() => null);
    if (cached) return JSON.parse(cached);
    const categories = await CategoryModel.findAll();
    redis.setex('categories', 600, JSON.stringify(categories)).catch(() => {});
    return categories;
  },

  async create(name: string) {
    const slug = toSlug(name);
    return CategoryModel.create(name.trim(), slug);
  },

  async update(id: string, name: string) {
    const slug = toSlug(name);
    return CategoryModel.update(id, name.trim(), slug);
  },

  async delete(id: string) {
    return CategoryModel.delete(id);
  },
};
