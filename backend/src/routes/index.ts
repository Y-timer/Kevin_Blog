import { Router } from 'express';
import authRoutes from './auth.routes';
import postRoutes from './post.routes';
import commentRoutes from './comment.routes';
import categoryRoutes from './category.routes';
import tagRoutes from './tag.routes';
import uploadRoutes from './upload.routes';
import oauthRoutes from './oauth.routes';
import prisma from '../config/prisma';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth', oauthRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/upload', uploadRoutes);

// 首页统计数据
router.get('/stats', async (_req, res) => {
  try {
    const [postCount, userCount] = await Promise.all([
      prisma.post.count({ where: { published: true } }),
      prisma.user.count(),
    ]);
    res.json({ data: { posts: postCount, users: userCount } });
  } catch {
    res.json({ data: { posts: 0, users: 0 } });
  }
});

export default router;
