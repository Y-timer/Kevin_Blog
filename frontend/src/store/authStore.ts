import { create } from 'zustand';
import type { User } from '../types';

/**
 * 认证状态管理 —— Zustand Store
 *
 * 持久化策略：
 * - accessToken / refreshToken 存入 localStorage（跨页面刷新保持登录）
 * - rememberMe 标志：true 表示用户勾选了"记住我"，AuthInit 会据此决定是否在 token 失效时清除登录态
 * - Zustand state 本身不持久化，每次页面加载由 AuthInit 组件重新从 localStorage 恢复
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // 初始化时检查 localStorage 中是否有 token，决定 isAuthenticated 初始值
  isAuthenticated: !!localStorage.getItem('accessToken'),

  /** 登录成功后的状态更新：存 token → 设置用户 → 标记已认证 */
  login: (user, accessToken, refreshToken, rememberMe) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (rememberMe) {
      // 记住我：持久化标记，AuthInit 据此决定 token 过期后的行为
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }
    set({ user, isAuthenticated: true });
  },

  /** 退出登录：清除所有存储 → 重置状态 */
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
    set({ user: null, isAuthenticated: false });
  },

  /** 仅更新用户信息（不涉及 token 操作） */
  setUser: (user) => set({ user }),
}));
