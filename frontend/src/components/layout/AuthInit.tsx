import { useEffect } from 'react';
import { isAxiosError } from 'axios';
import { useAuthStore } from '../../store/authStore';
import { getMe } from '../../services/auth';

/**
 * 应用初始化——页面加载时自动恢复登录态
 *
 * 工作流程：
 * 1. 检查 localStorage 中是否有 accessToken
 * 2. 如果有，调用 /api/auth/me 获取最新用户信息
 * 3. 成功 → 注入用户信息到 Zustand，标记 isAuthenticated = true
 * 4. 认证失效由接口统一处理，暂时的网络错误保留会话
 *
 * 包裹在 App 组件外层，所有页面都能获取到正确的认证状态
 */
export default function AuthInit({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    let active = true;
    if (!token) {
      // 无 token，确保状态为未登录
      useAuthStore.setState({ isAuthenticated: false, user: null });
      return;
    }
    getMe()
      .then((user) => {
        const currentUser = useAuthStore.getState().user;
        if (!active || !localStorage.getItem('accessToken') || (currentUser && currentUser.id !== user.id)) return;
        setUser(user);
        useAuthStore.setState({ isAuthenticated: true });
      })
      .catch((error) => {
        if (active && localStorage.getItem('accessToken') === token &&
            isAxiosError(error) && error.response?.status === 404) {
          logout();
        }
      });
    return () => { active = false; };
  }, [logout, setUser]);

  return <>{children}</>;
}
