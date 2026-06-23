import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * 路由守卫——未登录用户访问受保护页面时自动跳转到登录页
 *
 * 用法：
 * <Route path="/editor" element={<RequireAuth><EditorPage /></RequireAuth>} />
 *
 * 只检查 Zustand state 中的 isAuthenticated，
 * 不额外发 API 请求（认证态由 AuthInit 组件在应用启动时初始化）
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    // replace: true 表示替换当前历史记录，用户不能通过后退回到受保护页面
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
