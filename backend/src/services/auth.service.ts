import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';

/**
 * 对 JWT token 做 SHA-256 哈希后存入数据库
 * 原始 JWT 太长（>191 字符），无法直接存入 MySQL VARCHAR 列
 * 哈希后固定 64 字符，查找时同样哈希后比对
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  /**
   * 用户注册：校验邮箱/用户名唯一 → bcrypt 12轮加密密码 → 签发双 Token
   * 12 轮加密是安全与性能的平衡，每次需要约 300ms
   */
  async register(username: string, email: string, password: string) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      throw new Error(existing.email === email ? '邮箱已被注册' : '用户名已被使用');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
      // select 只返回安全字段，排除 password
      select: { id: true, username: true, email: true, avatar: true, bio: true, role: true, createdAt: true },
    });

    const tokens = this.generateTokens({ userId: user.id, role: user.role });
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('邮箱或密码错误');
    // 返回相同错误信息防止用户枚举攻击

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('邮箱或密码错误');

    const tokens = this.generateTokens({ userId: user.id, role: user.role });
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // 解构移除 password 字段，确保密码不返回给客户端
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  /**
   * 刷新 Token：验证旧 refreshToken → 删除旧记录 → 签发新双 Token
   * 采用"滚动刷新"策略——每次使用后旧 Token 立即失效，防止被窃取后重复使用
   */
  async refreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    // 数据库中存的是 token 的哈希值，查找时需先哈希
    const stored = await prisma.refreshToken.findUnique({ where: { token: hashToken(refreshToken) } });
    if (!stored) throw new Error('刷新令牌无效');

    // 一次性使用：删除旧 token，签发新 token
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = this.generateTokens({ userId: payload.userId, role: payload.role });
    await this.storeRefreshToken(payload.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: hashToken(refreshToken) } });
  }

  /**
   * 忘记密码——生成一次性重置 token，有效期 30 分钟
   * 使用 crypto.randomBytes 生成 32 字节随机 token（64 位十六进制）
   * 直接操作 password_resets 表（该表未在 Prisma schema 中定义 model，由应用启动时自动建表）
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('该邮箱未注册');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.$executeRawUnsafe(`INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)`, [
      token,
      user.id,
      expiresAt,
    ]);
    return { token, email };
  }

  /**
   * 重置密码：验证 token 有效性 → 检查是否过期 → 更新密码 → 删除已用 token
   */
  async resetPassword(token: string, newPassword: string) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT user_id, expires_at FROM password_resets WHERE token = ? LIMIT 1`,
      [token],
    );
    if (!rows.length) throw new Error('无效的重置链接');
    const row = rows[0];
    if (new Date(row.expires_at) > new Date()) {
      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: row.user_id }, data: { password: hashed } });
      await prisma.$executeRawUnsafe(`DELETE FROM password_resets WHERE token = ?`, [token]);
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM password_resets WHERE token = ?`, [token]);
      throw new Error('重置链接已过期');
    }
  }

  // OAuth 登录：邮箱已存在 → 直接签发 Token；不存在 → 自动注册
  async oauthLogin(email: string, username: string, avatar?: string) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 用户名可能重复，加随机后缀避免冲突
      const baseName = username.slice(0, 15);
      const uniqueName = `${baseName}_${crypto.randomBytes(3).toString('hex')}`;
      user = await prisma.user.create({
        data: {
          email,
          username: uniqueName,
          password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12),
          avatar,
        },
      });
    }
    if (!user) throw new Error('OAuth 登录失败');
    const tokens = this.generateTokens({ userId: user.id, role: user.role });
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, avatar: true, bio: true, role: true, createdAt: true },
    });
    if (!user) throw new Error('用户不存在');
    return user;
  }

  async updateProfile(userId: string, data: { username?: string; bio?: string; avatar?: string }) {
    // 修改用户名时检查是否与其他用户重复（排除自己）
    if (data.username) {
      const existing = await prisma.user.findFirst({ where: { username: data.username, NOT: { id: userId } } });
      if (existing) throw new Error('用户名已被使用');
    }
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, email: true, avatar: true, bio: true, role: true, createdAt: true },
    });
  }

  /**
   * 修改密码：先验证旧密码正确性，再加密新密码写入
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new Error('原密码错误');
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }

  /** 获取用户的文章列表，可按发布状态过滤 */
  async getUserPosts(userId: string, published?: boolean) {
    const where: any = { authorId: userId };
    if (published !== undefined) where.published = published;
    return prisma.post.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 获取用户的收藏文章列表，取出关联的 post 并含作者/分类/标签信息 */
  async getUserFavorites(userId: string) {
    const favs = await prisma.favorite.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: { select: { id: true, username: true, avatar: true } },
            category: true,
            tags: { include: { tag: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return favs.map((f) => f.post);
  }

  /**
   * 生成 accessToken（短期 15min）+ refreshToken（长期 7d）双 Token
   * accessToken 用于接口鉴权，refreshToken 用于无感刷新
   */
  private generateTokens(payload: TokenPayload) {
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  /**
   * 存储 refreshToken：从 JWT 解析过期时间 → 哈希后存入 MySQL
   * 哈希存储防止数据库泄露时攻击者直接获取有效 Token
   */
  private async storeRefreshToken(userId: string, token: string) {
    const decoded = verifyRefreshToken(token);
    // JWT payload 中的 exp 是秒级 Unix 时间戳，需转换为毫秒
    const expiresAt = new Date((decoded as any).exp! * 1000);

    await prisma.refreshToken.create({
      data: { token: hashToken(token), userId, expiresAt },
    });
  }
}

export const authService = new AuthService();
