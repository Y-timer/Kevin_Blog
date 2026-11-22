import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

const imageExtensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

// 存储配置：文件保存到 uploads/ 目录，文件名用随机哈希防止冲突
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve('uploads'));
  },
  filename: (_req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机哈希 + 原扩展名
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = imageExtensions.get(file.mimetype);
    cb(null, `${Date.now()}-${hash}${ext}`);
  },
});

// 只接受图片类型，最大 5MB
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, imageExtensions.has(file.mimetype)),
});

export function hasImageSignature(bytes: Buffer, type: string) {
  const header = bytes.subarray(0, 12);
  switch (type) {
    case 'image/jpeg': return header.subarray(0, 3).toString('hex') === 'ffd8ff';
    case 'image/png': return header.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    case 'image/gif': return /^(GIF87a|GIF89a)$/.test(header.subarray(0, 6).toString('ascii'));
    case 'image/webp': return header.subarray(0, 4).toString('ascii') === 'RIFF' &&
      header.subarray(8, 12).toString('ascii') === 'WEBP';
    default: return false;
  }
}
