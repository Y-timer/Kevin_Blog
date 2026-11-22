import prisma from '../config/prisma';

export class CommentService {
  async isPostPublished(postId: string) {
    return Boolean(await prisma.post.findFirst({ where: { id: postId, published: true }, select: { id: true } }));
  }

  async findByPost(postId: string, page = 1, pageSize = 50) {
    const [all, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        include: { author: { select: { id: true, username: true, avatar: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
      prisma.comment.count({ where: { postId } }),
    ]);
    return {
      data: all,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async create(postId: string, userId: string, content: string, parentId?: string) {
    if (parentId && !(await prisma.comment.findFirst({
      where: { id: parentId, postId, parentId: null },
      select: { id: true },
    }))) {
      return null;
    }
    return prisma.comment.create({
      data: { content, postId, userId, parentId: parentId || null },
      include: { author: { select: { id: true, username: true, avatar: true } } },
    });
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new Error('评论不存在');
    if (!isAdmin && comment.userId !== userId) throw new Error('无权删除此评论');
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { parentId: id, postId: comment.postId } }),
      prisma.comment.delete({ where: { id } }),
    ]);
  }
}

export const commentService = new CommentService();
