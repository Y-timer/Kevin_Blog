import prisma from '../config/prisma';
import { slugify } from '../utils/slug';

export class TagService {
  async findAll() {
    return prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string) {
    const slug = slugify(name);
    return prisma.tag.create({ data: { name, slug } });
  }
}

export const tagService = new TagService();
