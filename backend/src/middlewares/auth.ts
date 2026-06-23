import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// 扩展 Express Request 类型，添加 user 属性
// 通过 declare global 方式让 TypeScript 识别 req.user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * 强制鉴权中间件
 * 从 Authorization header 提取 Bearer token → 验证 JWT → 注入 req.user
 * 验证失败返回 401
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: '未提供认证令牌' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = payload; // 注入用户信息到请求对象
    next();
  } catch {
    res.status(401).json({ message: '认证令牌无效或已过期' });
  }
}

/**
 * 可选鉴权中间件
 * 如果请求带有有效 Token 则注入 req.user，没有 Token 或无效则静默跳过
 * 用于"登录可看更多内容"场景，如文章列表显示收藏状态
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyAccessToken(token);
    } catch {
      // Token 无效时不报错，只是不注入用户信息
    }
  }
  next();
}

/**
 * 管理员权限中间件
 * 必须在 authenticate 之后使用（依赖 req.user 已被注入）
 * 检查 user.role === 'ADMIN'，否则返回 403
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ message: '需要管理员权限' });
    return;
  }
  next();
}
