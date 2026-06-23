import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';

export class CommentController {
  async list(req: Request, res: Response) {
    try {
      const { page, pageSize } = req.query;
      const result = await commentService.findByPost(
        req.params.postId as string,
        Number(page) || 1,
        Number(pageSize) || 20,
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const comment = await commentService.create(req.params.postId as string, req.user!.userId, req.body.content, req.body.parentId);
      res.status(201).json({ data: comment });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
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
