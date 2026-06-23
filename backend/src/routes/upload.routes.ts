import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { upload } from '../config/upload';
import { uploadController } from '../controllers/upload.controller';

const router = Router();

// POST /api/upload/image —— 需要登录，单张图片
router.post('/image', authenticate, upload.single('image'), (req, res) => uploadController.uploadImage(req, res));

export default router;
