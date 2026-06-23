import prisma from '../config/prisma';

export class CommentService {
  async findByPost(postId: string, page = 1, pageSize = 50) {
    // 查该文章所有评论（包含作者信息），前端组织层级
    const [all, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        include: { author: { select: { id: true, username: true, avatar: true } } },
        take: pageSize,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.comment.count({ where: { postId } }),
    ]);
    return {
      data: all,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async create(postId: string, userId: string, content: string, parentId?: string) {
    return prisma.comment.create({
      data: { content, postId, userId, parentId: parentId || null },
      include: { author: { select: { id: true, username: true, avatar: true } } },
    });
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new Error('评论不存在');
    if (!isAdmin && comment.userId !== userId) throw new Error('无权删除此评论');
    // 级联删除子回复
    await prisma.comment.deleteMany({ where: { parentId: id } });
    await prisma.comment.delete({ where: { id } });
  }
}

export const commentService = new CommentService();
