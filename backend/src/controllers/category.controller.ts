import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';

export class CategoryController {
  async list(_req: Request, res: Response) {
    try {
      const categories = await categoryService.findAll();
      res.json({ data: categories });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const category = await categoryService.create(req.body.name);
      res.status(201).json({ data: category });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export const categoryController = new CategoryController();
