import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { tagSchema } from '../utils/validators';

const router = Router();

router.get('/', (req, res) => tagController.list(req, res));
router.post('/', authenticate, validate(tagSchema), (req, res) => tagController.create(req, res));

export default router;
