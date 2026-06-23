import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      const result = await authService.register(username, email, password);
      res.status(201).json({ data: result });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ data: result });
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ message: '缺少刷新令牌' });
        return;
      }
      const tokens = await authService.refreshToken(refreshToken);
      res.json({ data: tokens });
    } catch (err: any) {
      res.status(401).json({ message: err.message || '刷新令牌无效' });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.json({ message: '已退出登录' });
    } catch {
      res.json({ message: '已退出登录' });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json({ data: user });
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      res.json({ data: user });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, oldPassword, newPassword);
      res.json({ message: '密码修改成功' });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async myPosts(req: Request, res: Response) {
    try {
      const { published } = req.query;
      const p = published === 'false' ? false : published === 'true' ? true : undefined;
      const posts = await authService.getUserPosts(req.user!.userId, p);
      res.json({ data: posts });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async myFavorites(req: Request, res: Response) {
    try {
      const posts = await authService.getUserFavorites(req.user!.userId);
      res.json({ data: posts });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json({ message: '重置链接已发送', data: result });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      res.json({ message: '密码重置成功' });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export const authController = new AuthController();
