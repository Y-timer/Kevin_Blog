import prisma from '../config/prisma';
import { slugify } from '../utils/slug';

const postInclude = {
  author: { select: { id: true, username: true, avatar: true } },
  category: true,
  tags: { include: { tag: true } },
};

export class PostService {
  async findAll(params: {
    page?: number;
    pageSize?: number;
    categoryId?: string;
    tagId?: string;
    search?: string;
    published?: boolean;
  }) {
    const { page = 1, pageSize = 10, categoryId, tagId, search, published } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (published !== undefined) where.published = published;
    if (categoryId) where.categoryId = categoryId;
    if (tagId) where.tags = { some: { tagId } };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: postInclude,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      data: posts.map((p) => ({
        ...p,
        tags: p.tags.map((pt) => pt.tag),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findBySlug(slug: string) {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: postInclude,
    });
    if (!post) throw new Error('文章不存在');

    await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });

    return {
      ...post,
      views: post.views + 1,
      tags: post.tags.map((pt) => pt.tag),
    };
  }

  async create(data: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    published?: boolean;
    categoryId?: string;
    tagIds?: string[];
    authorId: string;
  }) {
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: slugify(data.title),
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        published: data.published ?? true,
        categoryId: data.categoryId,
        authorId: data.authorId,
        tags: data.tagIds?.length ? { create: data.tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: postInclude,
    });

    return { ...post, tags: post.tags.map((pt) => pt.tag) };
  }

  async update(
    id: string,
    authorId: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      coverImage?: string;
      published?: boolean;
      categoryId?: string;
      tagIds?: string[];
    },
  ) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error('文章不存在');
    if (post.authorId !== authorId) throw new Error('无权编辑此文章');

    if (data.tagIds) {
      await prisma.postTag.deleteMany({ where: { postId: id } });
    }

    const updateData: any = { ...data };
    if (data.title) updateData.slug = slugify(data.title);
    delete updateData.tagIds;

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...updateData,
        tags: data.tagIds?.length ? { create: data.tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: postInclude,
    });

    return { ...updated, tags: updated.tags.map((pt) => pt.tag) };
  }

  async getNeighbors(slug: string) {
    const current = await prisma.post.findUnique({ where: { slug }, select: { id: true, createdAt: true } });
    if (!current) throw new Error('文章不存在');
    const [prev, next] = await Promise.all([
      prisma.post.findFirst({ where: { published: true, createdAt: { lt: current.createdAt } }, orderBy: { createdAt: 'desc' }, select: { title: true, slug: true } }),
      prisma.post.findFirst({ where: { published: true, createdAt: { gt: current.createdAt } }, orderBy: { createdAt: 'asc' }, select: { title: true, slug: true } }),
    ]);
    return { prev: prev || null, next: next || null };
  }

  async delete(id: string, authorId: string, isAdmin: boolean) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error('文章不存在');
    if (!isAdmin && post.authorId !== authorId) throw new Error('无权删除此文章');

    await prisma.post.delete({ where: { id } });
  }
}

export const postService = new PostService();
