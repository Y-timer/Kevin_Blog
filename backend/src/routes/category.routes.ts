import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { categorySchema } from '../utils/validators';

const router = Router();

router.get('/', (req, res) => categoryController.list(req, res));
router.post('/', authenticate, validate(categorySchema), (req, res) => categoryController.create(req, res));

export default router;
