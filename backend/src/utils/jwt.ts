import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    jwtid: randomUUID(),
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload & { exp: number } {
  const payload = jwt.verify(token, config.jwt.refreshSecret);
  if (typeof payload === 'string' || typeof payload.exp !== 'number' ||
      typeof payload.userId !== 'string' || typeof payload.role !== 'string') {
    throw new Error('刷新令牌无效');
  }
  return { userId: payload.userId, role: payload.role, exp: payload.exp };
}
