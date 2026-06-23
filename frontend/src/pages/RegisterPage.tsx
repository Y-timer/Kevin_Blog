import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import ParticleBackground from '../components/layout/ParticleBackground';
import { useAuthStore } from '../store/authStore';
import { register as registerApi } from '../services/auth';
import type { RegisterInput } from '../types';
import { getApiErrorMessage } from '../utils/errors';

const registerSchema = z
  .object({
    username: z.string().min(2, '用户名至少2个字符').max(20, '用户名最多20个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(8, '密码至少8位'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码不一致',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);   //显示密码
  const [agreed, setAgreed] = useState(false);     //是否同意条款
  const [serverError, setServerError] = useState('');  //服务器错误消息
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const loginState = useAuthStore((s) => s.login);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current as unknown as number);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    try {
      const result = await registerApi(data);
      loginState(result.user, result.accessToken, result.refreshToken);
      navigate('/');
    } catch (err) {
      const msg = getApiErrorMessage(err, '注册失败，请稍后重试');
      setServerError(msg);
      setToastVisible(true);
      if (toastTimer.current) clearTimeout(toastTimer.current as unknown as number);
      toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] py-8">
      <ParticleBackground />

      {/* 返回首页 */}
      <Link
        to="/"
        className="text-text-secondary border-border-subtle hover:text-accent-cyan hover:border-border-glow group fixed top-6 left-6 z-10 flex items-center gap-2 rounded-3xl border bg-[rgba(10,10,15,0.7)] px-4 py-2 text-sm font-medium backdrop-blur-md transition-all hover:shadow-[0_0_16px_rgba(0,229,255,0.1)]"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        返回首页
      </Link>

      <div className="relative z-10 w-full max-w-110 px-5">
        <div className="gradient-border-card-register">
          <div className="mb-7 text-center">
            <Link
              to="/"
              className="gradient-text text-2xl font-extrabold tracking-wider"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              KevinSpace
            </Link>
          </div>

          {/* 标题 */}
          <div className="mb-1.5 text-center">
            <h1 className="text-text-primary text-2xl font-bold tracking-[-0.3px]">创建账户</h1>
            <p className="text-text-muted mt-1.5 text-sm">加入 KevinSpace，开启技术探索之旅</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            {/* 用户名 */}
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold tracking-wide text-[#9090a8]">用户名</label>
              <div className="relative">
                <User
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#606078]"
                />
                <input
                  type="text"
                  {...register('username')}
                  placeholder="选择您的用户名"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] py-[11px] pr-4 pl-11 text-[0.94rem] text-[#e0e0e8] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:bg-[rgba(0,229,255,0.02)] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]"
                />
              </div>
              {errors.username && <p className="mt-1.5 text-xs text-[#ff2d95]">{errors.username.message}</p>}
            </div>

            {/* 邮箱地址 */}
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold tracking-wide text-[#9090a8]">邮箱地址</label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#606078]"
                />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] py-[11px] pr-4 pl-11 text-[0.94rem] text-[#e0e0e8] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:bg-[rgba(0,229,255,0.02)] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-[#ff2d95]">{errors.email.message}</p>}
            </div>

            {/* 密码部分 */}
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold tracking-wide text-[#9090a8]">密码</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#606078]"
                />
                <input
                  type={showPwd ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="至少 8 位字符"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] py-[11px] pr-11 pl-11 text-[0.94rem] text-[#e0e0e8] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:bg-[rgba(0,229,255,0.02)] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center p-1 text-[#606078] transition-colors hover:text-[#00e5ff]"
                  aria-label="切换密码可见性"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-0.5 text-[0.74rem] text-[#606078]">密码长度至少 8 位，建议包含字母、数字和符号</p>
              {errors.password && <p className="mt-1.5 text-xs text-[#ff2d95]">{errors.password.message}</p>}
            </div>

            {/* 确认密码部分 */}
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold tracking-wide text-[#9090a8]">确认密码</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#606078]"
                />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="再次输入密码"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] py-[11px] pr-4 pl-11 text-[0.94rem] text-[#e0e0e8] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:bg-[rgba(0,229,255,0.02)] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-[#ff2d95]">{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-[0.82rem] text-[#606078] select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-px h-[18px] w-[18px] flex-shrink-0 cursor-pointer rounded border-[rgba(255,255,255,0.06)] bg-[#111118] accent-[#00e5ff]"
              />
              <span className="leading-relaxed">
                我已阅读并同意{' '}
                <a
                  href="#"
                  className="font-medium text-[#00e5ff] hover:text-[#b44dff]"
                  onClick={(e) => e.preventDefault()}
                >
                  服务条款
                </a>{' '}
                和{' '}
                <a
                  href="#"
                  className="font-medium text-[#00e5ff] hover:text-[#b44dff]"
                  onClick={(e) => e.preventDefault()}
                >
                  隐私政策
                </a>
              </span>
            </label>

            {/* 提交 */}
            <button
              type="submit"
              disabled={isSubmitting || !agreed}
              className="group relative mt-1 w-full overflow-hidden rounded-lg py-[13px] text-[0.96rem] font-bold tracking-[0.5px] text-white transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #b44dff, #00e5ff)',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 28px rgba(180, 77, 255, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: 'linear-gradient(135deg, #00e5ff, #ff2d95)' }}
              />
              <span className="relative z-10">{isSubmitting ? '创建中...' : '创建账户'}</span>
            </button>
          </form>

          {/* 或 */}
          <div className="my-5 flex items-center gap-3.5">
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.06)]" />
            <span className="text-[0.78rem] tracking-wider text-[#606078] uppercase">或</span>
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.06)]" />
          </div>

          {/* 社交注册 */}
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setServerError('该功能暂时还未做好，请使用邮箱注册');
                setToastVisible(true);
                if (toastTimer.current) clearTimeout(toastTimer.current as unknown as number);
                toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
              }}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] py-2.5 text-[0.88rem] font-medium text-[#e0e0e8] transition-all hover:border-[rgba(0,229,255,0.25)] hover:bg-[#1a1a28] hover:shadow-[0_0_16px_rgba(0,229,255,0.06)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              onClick={() => {
                setServerError('该功能暂时还未做好，请使用邮箱注册');
                setToastVisible(true);
                if (toastTimer.current) clearTimeout(toastTimer.current as unknown as number);
                toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
              }}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] py-2.5 text-[0.88rem] font-medium text-[#e0e0e8] transition-all hover:border-[rgba(0,229,255,0.25)] hover:bg-[#1a1a28] hover:shadow-[0_0_16px_rgba(0,229,255,0.06)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#e0e0e8">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* 登录链接 */}
          <p className="mt-5 text-center text-[0.86rem] text-[#606078]">
            已有账户？{' '}
            <Link to="/login" className="font-semibold text-[#00e5ff] hover:text-[#b44dff]">
              立即登录
            </Link>
          </p>
        </div>
        {/* Toast弹窗 */}
        <div
          className={`pointer-events-none fixed right-6 bottom-20 z-[999] rounded-lg border border-[rgba(255,45,149,0.25)] bg-[#14141e] px-6 py-3 text-[0.88rem] font-semibold text-[#ff2d95] transition-all duration-300 ${toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
          style={{ boxShadow: '0 0 20px rgba(255,45,149,0.15)' }}
        >
          {serverError}
        </div>
      </div>
    </div>
  );
}
