import { Request, Response } from 'express';
import { postService } from '../services/post.service';

export class PostController {
  async list(req: Request, res: Response) {
    try {
      const { page, pageSize, categoryId, tagId, search, published } = req.query;
      const result = await postService.findAll({
        page: pageSize ? Number(page) || 1 : 1,
        pageSize: Number(pageSize) || 10,
        categoryId: categoryId as string,
        tagId: tagId as string,
        search: search as string,
        published: published !== undefined ? published === 'true' : true,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const post = await postService.findBySlug(req.params.slug as string);
      res.json({ data: post });
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const post = await postService.create({ ...req.body, authorId: req.user!.userId });
      res.status(201).json({ data: post });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const post = await postService.update(req.params.id as string, req.user!.userId, req.body);
      res.json({ data: post });
    } catch (err: any) {
      const status = err.message === '文章不存在' ? 404 : 403;
      res.status(status).json({ message: err.message });
    }
  }

  async neighbors(req: Request, res: Response) {
    try {
      const result = await postService.getNeighbors(req.params.slug as string);
      res.json({ data: result });
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      await postService.delete(req.params.id as string, req.user!.userId, isAdmin);
      res.json({ message: '文章已删除' });
    } catch (err: any) {
      const status = err.message === '文章不存在' ? 404 : 403;
      res.status(status).json({ message: err.message });
    }
  }
}

export const postController = new PostController();
