import { Request, Response } from 'express';
import prisma from '../config/prisma';

export class UploadController {
  // 单张图片上传，返回可访问的 URL，同时记录到 images 表
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        res.status(400).json({ message: '请选择要上传的图片' });
        return;
      }
      const url = `/uploads/${req.file.filename}`;
      // 用原生 SQL 写入 images 表（避免 Prisma generate 问题）
      await prisma.$executeRawUnsafe(
        `INSERT INTO images (id, filename, url, size, user_id, created_at) VALUES (UUID(), ?, ?, ?, ?, NOW())`,
        [req.file.filename, url, req.file.size, req.user!.userId],
      );
      res.json({
        data: {
          url,
          filename: req.file.filename,
          size: req.file.size,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || '上传失败' });
    }
  }
}

export const uploadController = new UploadController();
