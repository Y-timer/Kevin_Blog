import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getMe } from '../../services/auth';

/**
 * 应用初始化——页面加载时自动恢复登录态
 *
 * 工作流程：
 * 1. 检查 localStorage 中是否有 accessToken
 * 2. 如果有，调用 /api/auth/me 获取最新用户信息
 * 3. 成功 → 注入用户信息到 Zustand，标记 isAuthenticated = true
 * 4. 失败 → 如果用户勾选了"记住我"，保留 token（可能是网络问题）
 *           → 如果未勾选，清除 token（token 过期且用户不希望保留）
 *
 * 包裹在 App 组件外层，所有页面都能获取到正确的认证状态
 */
export default function AuthInit({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // 无 token，确保状态为未登录
      useAuthStore.setState({ isAuthenticated: false, user: null });
      return;
    }
    getMe()
      .then((user) => {
        setUser(user);
        useAuthStore.setState({ isAuthenticated: true });
      })
      .catch(() => {
        // token 无效，如果用户没勾选"记住我"则清除登录态
        if (!localStorage.getItem('rememberMe')) {
          logout();
        }
      });
  }, [logout, setUser]);

  return <>{children}</>;
}
