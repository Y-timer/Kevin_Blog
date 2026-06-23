import { Request, Response } from 'express';
import { getGoogleAuthURL, getGoogleUser, getGitHubAuthURL, getGitHubUser } from '../utils/oauth';
import { authService } from '../services/auth.service';
import logger from '../config/logger';

export class OAuthController {
  // 跳转到 Google 登录页
  googleAuth(_req: Request, res: Response) {
    res.redirect(getGoogleAuthURL());
  }

  // Google 回调：验证用户 → 创建/查找 → 签发 JWT → 跳转前端
  async googleCallback(req: Request, res: Response) {
    try {
      const { code } = req.query;
      if (!code) {
        res.status(400).send('缺少授权码');
        return;
      }

      const profile = await getGoogleUser(code as string);
      const result = await authService.oauthLogin(profile.email, profile.username, profile.avatar);

      // 将 token 通过 URL 参数传到前端
      res.redirect(
        `http://localhost:5173/oauth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch (err: any) {
      logger.error('Google OAuth failed:', err.message);
      res.status(500).send('Google 登录失败，请稍后重试');
    }
  }

  // 跳转到 GitHub 登录页
  githubAuth(_req: Request, res: Response) {
    res.redirect(getGitHubAuthURL());
  }

  // GitHub 回调
  async githubCallback(req: Request, res: Response) {
    try {
      const { code } = req.query;
      if (!code) {
        res.status(400).send('缺少授权码');
        return;
      }

      const profile = await getGitHubUser(code as string);
      const result = await authService.oauthLogin(profile.email, profile.username, profile.avatar);

      res.redirect(
        `http://localhost:5173/oauth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch (err: any) {
      logger.error('GitHub OAuth failed:', err.message);
      res.status(500).send('GitHub 登录失败，请稍后重试');
    }
  }
}

export const oauthController = new OAuthController();
