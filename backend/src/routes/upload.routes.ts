import { Router } from 'express';
import { MulterError } from 'multer';
import { authenticate } from '../middlewares/auth';
import { upload } from '../config/upload';
import { uploadController } from '../controllers/upload.controller';

const router = Router();

// POST /api/upload/image —— 需要登录，单张图片
const receiveImage = upload.single('image');
router.post('/image', authenticate, (req, res, next) => {
  receiveImage(req, res, (error: unknown) => {
    if (error instanceof MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      res.status(tooLarge ? 413 : 400).json({ message: tooLarge ? '图片大小不能超过 5 MB' : '请选择一张图片' });
    } else if (error) {
      next(error);
    } else {
      void uploadController.uploadImage(req, res);
    }
  });
});

export default router;
