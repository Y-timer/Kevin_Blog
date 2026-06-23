import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { postSchema, postUpdateSchema } from '../utils/validators';

const router = Router();

router.get('/', (req, res) => postController.list(req, res));
// /:slug/neighbors 必须在 /:slug 之前注册，否则会被 /:slug 捕获
router.get('/:slug/neighbors', (req, res) => postController.neighbors(req, res));
router.get('/:slug', (req, res) => postController.getBySlug(req, res));
router.post('/', authenticate, validate(postSchema), (req, res) => postController.create(req, res));
router.put('/:id', authenticate, validate(postUpdateSchema), (req, res) => postController.update(req, res));
router.delete('/:id', authenticate, (req, res) => postController.delete(req, res));

export default router;
