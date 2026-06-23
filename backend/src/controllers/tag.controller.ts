import { Request, Response } from 'express';
import { tagService } from '../services/tag.service';

export class TagController {
  async list(_req: Request, res: Response) {
    try {
      const tags = await tagService.findAll();
      res.json({ data: tags });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const tag = await tagService.create(req.body.name);
      res.status(201).json({ data: tag });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export const tagController = new TagController();
