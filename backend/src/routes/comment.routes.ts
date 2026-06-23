import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { commentSchema } from '../utils/validators';

const router = Router();

router.get('/post/:postId', (req, res) => commentController.list(req, res));
router.post('/post/:postId', authenticate, validate(commentSchema), (req, res) => commentController.create(req, res));
router.delete('/:id', authenticate, (req, res) => commentController.delete(req, res));

export default router;
