import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { paginationQuery } from '../utils/validators';
import logger from '../config/logger';

export class CommentController {
  async list(req: Request, res: Response) {
    const query = paginationQuery.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ message: '无效的评论分页参数' });
      return;
    }
    try {
      const { postId } = req.params;
      const { page = 1, pageSize = 20 } = query.data;
      if (!(await commentService.isPostPublished(postId))) {
        res.status(404).json({ message: '文章不存在' });
        return;
      }
      const result = await commentService.findByPost(postId, page, pageSize);
      res.json(result);
    } catch (error) {
      logger.error('评论查询失败', { error });
      res.status(500).json({ message: '评论加载失败' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      if (!(await commentService.isPostPublished(postId))) {
        res.status(404).json({ message: '文章不存在' });
        return;
      }
      const comment = await commentService.create(postId, req.user!.userId, req.body.content, req.body.parentId);
      if (!comment) {
        res.status(400).json({ message: '被回复的评论不存在或无法回复' });
        return;
      }
      res.status(201).json({ data: comment });
    } catch (error) {
      logger.error('发表评论失败', { error });
      res.status(500).json({ message: '评论发表失败，请重试' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      await commentService.delete(req.params.id as string, req.user!.userId, isAdmin);
      res.json({ message: '评论已删除' });
    } catch (err: any) {
      const status = err.message === '评论不存在' ? 404 : 403;
      res.status(status).json({ message: err.message });
    }
  }
}

export const commentController = new CommentController();
