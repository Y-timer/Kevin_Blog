import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// 存储配置：文件保存到 uploads/ 目录，文件名用随机哈希防止冲突
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机哈希 + 原扩展名
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${hash}${ext}`);
  },
});

// 只接受图片类型，最大 5MB
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG / PNG / WebP / GIF / SVG 格式'));
    }
  },
});
