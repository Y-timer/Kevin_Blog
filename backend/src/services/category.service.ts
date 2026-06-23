import prisma from '../config/prisma';
import { slugify } from '../utils/slug';

export class CategoryService {
  async findAll() {
    return prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string) {
    const slug = slugify(name);
    return prisma.category.create({ data: { name, slug } });
  }
}

export const categoryService = new CategoryService();
