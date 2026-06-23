import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../services/auth';

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const loginState = useAuthStore((s) => s.login);

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      // 获取用户信息并写入 store
      getMe()
        .then((user) => {
          loginState(user, accessToken, refreshToken);
          navigate('/', { replace: true });
        })
        .catch(() => {
          navigate('/login', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [loginState, navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <p className="text-sm text-[#9090a8]">登录中...</p>
    </div>
  );
}
