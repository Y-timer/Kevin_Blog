import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { postService } from '../services/post.service';
import { postListQuery } from '../utils/validators';
import logger from '../config/logger';

export class PostController {
  async list(req: Request, res: Response) {
    const query = postListQuery.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ message: '无效的文章筛选或分页参数' });
      return;
    }
    const { published, ...filters } = query.data;
    if (published === 'false') {
      const { page = 1, pageSize = 10 } = filters;
      res.json({ data: [], pagination: { page, pageSize, total: 0, totalPages: 0 } });
      return;
    }
    try {
      const result = await postService.findAll({
        ...filters,
        published: true,
      });
      res.json(result);
    } catch (error) {
      logger.error('文章列表查询失败', { error });
      res.status(500).json({ message: '文章列表加载失败' });
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const post = await postService.findBySlug(req.params.slug as string);
      if (!post) {
        res.status(404).json({ message: '文章不存在' });
        return;
      }
      res.json({ data: post });
    } catch (error) {
      logger.error('文章详情查询失败', { error });
      res.status(500).json({ message: '文章加载失败' });
    }
  }

  async getForEdit(req: Request, res: Response) {
    res.setHeader('Cache-Control', 'private, no-store');
    try {
      const post = await postService.findForEdit(req.params.slug as string, req.user!.userId);
      if (!post) {
        res.status(404).json({ message: '文章不存在或无权编辑' });
        return;
      }
      res.json({ data: post });
    } catch (error) {
      logger.error('编辑文章查询失败', { error });
      res.status(500).json({ message: '文章加载失败' });
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2003' || error.code === 'P2025')) {
        res.status(400).json({ message: '文章、分类或标签已不存在，请刷新后重试' });
        return;
      }
      if (error instanceof Error && error.message === '文章不存在') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error instanceof Error && error.message === '无权编辑此文章') {
        res.status(403).json({ message: error.message });
        return;
      }
      logger.error('文章更新失败', { error });
      res.status(500).json({ message: '文章更新失败，请重试' });
    }
  }

  async neighbors(req: Request, res: Response) {
    try {
      const result = await postService.getNeighbors(req.params.slug as string);
      if (!result) {
        res.status(404).json({ message: '文章不存在' });
        return;
      }
      res.json({ data: result });
    } catch (error) {
      logger.error('相邻文章查询失败', { error });
      res.status(500).json({ message: '相邻文章加载失败' });
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
