import { Router } from 'express';
import { oauthController } from '../controllers/oauth.controller';

const router = Router();

// Google OAuth
router.get('/google', (req, res) => oauthController.googleAuth(req, res));
router.get('/google/callback', (req, res) => oauthController.googleCallback(req, res));

// GitHub OAuth
router.get('/github', (req, res) => oauthController.githubAuth(req, res));
router.get('/github/callback', (req, res) => oauthController.githubCallback(req, res));

export default router;
