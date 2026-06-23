import api from './api';
import type { LoginInput, RegisterInput, AuthResponse, User } from '../types';

/**
 * 认证相关 API 调用封装
 *
 * 注意：
 * - register 时需要排除 confirmPassword 字段，后端不需要此字段
 * - login/register 返回的 AuthResponse 包含 user + accessToken + refreshToken
 * - refreshToken 的刷新走独立的 /auth/refresh 端点
 */

export async function login(data: LoginInput): Promise<AuthResponse> {
  const res = await api.post('/auth/login', data);
  return res.data.data;
}

export async function register(data: RegisterInput): Promise<AuthResponse> {
  // 解构排除 confirmPassword —— 该字段仅用于前端验证，后端不接收
  const rest = {
    username: data.username,
    email: data.email,
    password: data.password,
  };
  const res = await api.post('/auth/register', rest);
  return res.data.data;
}

/** 用 refreshToken 换取新的 accessToken */
export async function refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await api.post('/auth/refresh', { refreshToken: token });
  return res.data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

/** 获取当前登录用户信息 */
export async function getMe(): Promise<User> {
  const res = await api.get('/auth/me');
  return res.data.data;
}
