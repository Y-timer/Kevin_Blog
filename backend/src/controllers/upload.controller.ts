import { Request, Response } from 'express';
import { readFile, unlink } from 'node:fs/promises';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { hasImageSignature } from '../config/upload';

export class UploadController {
  // 单张图片上传，返回可访问的 URL，同时记录到 images 表
  async uploadImage(req: Request, res: Response) {
    const { file } = req;
    if (!file) {
      res.status(400).json({ message: '请选择 JPG、PNG、WebP 或 GIF 图片' });
      return;
    }
    const cleanup = async () => {
      await unlink(file.path).catch((error) => logger.error('无法清理未保存的上传文件', { error }));
    };
    try {
      if (!hasImageSignature(await readFile(file.path), file.mimetype)) {
        await cleanup();
        res.status(415).json({ message: '图片内容与文件格式不匹配' });
        return;
      }
      const url = `/uploads/${file.filename}`;
      await prisma.$executeRaw`
        INSERT INTO images (id, filename, url, size, user_id, created_at)
        VALUES (UUID(), ${file.filename}, ${url}, ${file.size}, ${req.user!.userId}, NOW())
      `;
      res.json({
        data: {
          url,
          filename: file.filename,
          size: file.size,
        },
      });
    } catch (error) {
      await cleanup();
      logger.error('保存图片失败', { error });
      res.status(500).json({ message: '保存图片失败，请重试' });
    }
  }
}

export const uploadController = new UploadController();
