import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { slugify } from '../utils/slug';

const postInclude = {
  author: { select: { id: true, username: true, avatar: true, bio: true } },
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

    const where: Prisma.PostWhereInput = {};
    if (published !== undefined) where.published = published;
    if (categoryId) where.categoryId = categoryId;
    if (tagId) where.tags = { some: { tagId } };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: postInclude,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
    // 计入浏览量时保留正文的更新时间，供编辑器判断本地草稿是否过期。
    const updated = await prisma.$executeRaw`
      UPDATE posts SET views = views + 1 WHERE slug = ${slug} AND published = true
    `;
    if (!updated) return null;
    const post = await prisma.post.findFirst({
      where: { slug, published: true },
      include: postInclude,
    });
    if (!post) return null;

    return {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    };
  }

  async findForEdit(slug: string, authorId: string) {
    const post = await prisma.post.findFirst({ where: { slug, authorId }, include: postInclude });
    return post && { ...post, tags: post.tags.map(({ tag }) => tag) };
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
        tags: data.tagIds?.length ? { create: [...new Set(data.tagIds)].map((tagId) => ({ tagId })) } : undefined,
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
      categoryId?: string | null;
      tagIds?: string[];
    },
  ) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error('文章不存在');
    if (post.authorId !== authorId) throw new Error('无权编辑此文章');

    const { tagIds, ...fields } = data;
    const uniqueTagIds = tagIds && [...new Set(tagIds)];
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...fields,
        tags: uniqueTagIds && {
          deleteMany: uniqueTagIds.length ? { tagId: { notIn: uniqueTagIds } } : {},
          upsert: uniqueTagIds.map((tagId) => ({
            where: { postId_tagId: { postId: id, tagId } },
            create: { tagId },
            update: {},
          })),
        },
      },
      include: postInclude,
    });

    return { ...updated, tags: updated.tags.map((pt) => pt.tag) };
  }

  async getNeighbors(slug: string) {
    const current = await prisma.post.findFirst({
      where: { slug, published: true },
      select: { id: true, createdAt: true },
    });
    if (!current) return null;
    const { id, createdAt } = current;
    const [prev, next] = await Promise.all([
      prisma.post.findFirst({
        where: { published: true, OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }] },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { title: true, slug: true },
      }),
      prisma.post.findFirst({
        where: { published: true, OR: [{ createdAt: { gt: createdAt } }, { createdAt, id: { gt: id } }] },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { title: true, slug: true },
      }),
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
