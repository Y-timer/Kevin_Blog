import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, FileText, Heart, LogOut } from 'lucide-react';
import ParticleBackground from '../components/layout/ParticleBackground';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import { useAuthStore } from '../store/authStore';
import { getMe, logout as logoutApi } from '../services/auth';
import api from '../services/api';
import type { Post } from '../types';
import { getApiErrorMessage } from '../utils/errors';

const tabs = [
  { key: 'profile', label: '个人资料', icon: User },
  { key: 'password', label: '修改密码', icon: Lock },
  { key: 'posts', label: '我的文章', icon: FileText },
  { key: 'favorites', label: '我的收藏', icon: Heart },
] as const;
type TabKey = (typeof tabs)[number]['key'];

const profileSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(20),
  bio: z.string().max(200).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入原密码'),
    newPassword: z.string().min(8, '新密码至少8位'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: '两次密码不一致', path: ['confirmPassword'] });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function UserCenterPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const authLogout = useAuthStore((s) => s.logout);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: 30 * 1000 });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { username: user?.username || '', bio: user?.bio || '' },
  });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const postsQuery = useQuery({
    queryKey: ['my-posts'],
    queryFn: async () => {
      const r = await api.get<{ data: Post[] }>('/auth/posts');
      return r.data.data;
    },
    enabled: activeTab === 'posts',
  });

  const favoritesQuery = useQuery({
    queryKey: ['my-favorites'],
    queryFn: async () => {
      const r = await api.get<{ data: Post[] }>('/auth/favorites');
      return r.data.data;
    },
    enabled: activeTab === 'favorites',
  });

  const profileMut = useMutation({
    mutationFn: (data: ProfileForm) => api.put('/auth/profile', data),
    onSuccess: () => {
      setProfileMsg('资料已更新');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => setProfileMsg(getApiErrorMessage(e, '更新失败')),
  });

  const passwordMut = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.put('/auth/password', { oldPassword: data.oldPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      setPasswordMsg('密码修改成功');
      passwordForm.reset();
    },
    onError: (e) => setPasswordMsg(getApiErrorMessage(e, '修改失败')),
  });

  const handleLogout = async () => {
    try {
      await logoutApi(localStorage.getItem('refreshToken') || '');
    } catch {
      localStorage.removeItem('refreshToken');
    }
    authLogout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <ParticleBackground />

      {/* 顶部导航栏 */}
      <nav className="glass border-border-subtle fixed top-0 right-0 left-0 z-100 border-b">
        <div className="mx-auto flex items-center justify-between px-6" style={{ maxWidth: '1280px', height: '64px' }}>
          <Link
            to="/"
            className="gradient-text relative text-[1.6rem] font-extrabold tracking-[1px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            KevinBlog
            <span
              className="absolute left-0"
              style={{
                bottom: '-4px',
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, #00e5ff, #b44dff)',
                borderRadius: '1px',
              }}
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-text-secondary hover:text-accent-cyan text-sm font-bold transition-colors">
              返回首页
            </Link>
            <button
              onClick={handleLogout}
              className="text-text-secondary hover:text-accent-pink flex items-center gap-1 text-sm font-bold transition-colors ml-5"
            >
              <LogOut size={14} /> 退出
            </button>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: '64px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 24px' }} className="py-10">
          {/* 用户介绍卡片 */}
          <div className="card mb-8 flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-start mt-6">
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #00e5ff, #b44dff)' }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="mb-1 text-2xl font-bold text-[#e0e0e8]">{user?.username || '...'}</h1>
              <p className="mb-3 text-sm text-[#606078]">{user?.email}</p>
              <p className="max-w-lg text-sm leading-relaxed text-[#9090a8]">{user?.bio || '暂无个人简介'}</p>
              <span
                className="mt-3 inline-block rounded-lg border border-[rgba(0,229,255,0.15)] bg-[rgba(0,229,255,0.08)] px-3 py-1 font-mono text-xs text-[#00e5ff]"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}
              >
                {user?.role === 'ADMIN' ? '管理员' : '用户'}
              </span>
            </div>
          </div>

          {/* 标签 */}
          <div className="mb-8 flex gap-1 overflow-x-auto border-b border-[rgba(255,255,255,0.06)]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-[1px] flex font-bold items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'border-[#00e5ff] text-[#00e5ff]' : 'border-transparent text-[#606078] hover:text-[#9090a8]'}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="card p-8 mb-10">
            {activeTab === 'profile' && (
              <form onSubmit={profileForm.handleSubmit((d) => profileMut.mutate(d))} className="max-w-md">
                <h2 className="mb-6 text-lg font-bold text-[#e0e0e8]">编辑个人资料</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#9090a8]">用户名</label>
                    <input
                      {...profileForm.register('username')}
                      className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-3 text-sm text-[#e0e0e8] transition-all outline-none focus:border-[#00e5ff] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]"
                    />
                    {profileForm.formState.errors.username && (
                      <p className="mt-1 text-xs text-[#ff2d95]">{profileForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#9090a8]">个人简介</label>
                    <textarea
                      {...profileForm.register('bio')}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-3 text-sm text-[#e0e0e8] transition-all outline-none focus:border-[#00e5ff] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]"
                    />
                  </div>
                  {profileMsg && (
                    <p className={`text-sm ${profileMsg.includes('失败') ? 'text-[#ff2d95]' : 'text-[#00ff88]'}`}>
                      {profileMsg}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={profileMut.isPending}
                    className="rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#b44dff] px-6 py-3 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-60"
                  >
                    保存修改
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={passwordForm.handleSubmit((d) => passwordMut.mutate(d))} className="max-w-md">
                <h2 className="mb-6 text-lg font-bold text-[#e0e0e8]">修改密码</h2>
                <div className="flex flex-col gap-4">
                  {(['oldPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
                    <div key={field}>
                      <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#9090a8]">
                        {field === 'oldPassword' ? '原密码' : field === 'newPassword' ? '新密码' : '确认新密码'}
                      </label>
                      <input
                        type="password"
                        {...passwordForm.register(field)}
                        className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-3 text-sm text-[#e0e0e8] transition-all outline-none focus:border-[#00e5ff] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]"
                      />
                      {passwordForm.formState.errors[field] && (
                        <p className="mt-1 text-xs text-[#ff2d95]">{passwordForm.formState.errors[field]?.message}</p>
                      )}
                    </div>
                  ))}
                  {passwordMsg && (
                    <p
                      className={`text-sm ${passwordMsg.includes('失败') || passwordMsg.includes('错误') ? 'text-[#ff2d95]' : 'text-[#00ff88]'}`}
                    >
                      {passwordMsg}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={passwordMut.isPending}
                    className="rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#b44dff] px-6 py-3 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-60"
                  >
                    修改密码
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'posts' && (
              <div>
                <h2 className="mb-6 text-lg font-bold text-[#e0e0e8]">我的文章</h2>
                {postsQuery.isLoading && <p className="text-sm text-[#606078]">加载中...</p>}
                {postsQuery.data?.length === 0 && <p className="text-sm text-[#606078]">暂无文章</p>}
                <div className="flex flex-col gap-3">
                  {postsQuery.data?.map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.slug}`}
                      className="card group flex items-center justify-between p-4 transition-all hover:border-[rgba(0,229,255,0.2)] hover:bg-[#1a1a28]"
                    >
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-[#e0e0e8] transition-colors group-hover:text-[#00e5ff]">
                            {post.title}
                          </span>
                          {!post.published && (
                            <span className="rounded bg-[rgba(255,45,149,0.1)] px-2 py-0.5 text-[0.7rem] text-[#ff2d95]">
                              草稿
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#606078]">
                          {new Date(post.createdAt).toLocaleDateString('zh-CN')} · {post.views} 阅读 · {post.likes} 赞
                        </span>
                      </div>
                      <span className="text-xs text-[#606078] transition-colors group-hover:text-[#00e5ff]">
                        &rarr;
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <h2 className="mb-6 text-lg font-bold text-[#e0e0e8]">我的收藏</h2>
                {favoritesQuery.isLoading && <p className="text-sm text-[#606078]">加载中...</p>}
                {favoritesQuery.data?.length === 0 && <p className="text-sm text-[#606078]">暂无收藏</p>}
                <div className="flex flex-col gap-3">
                  {favoritesQuery.data?.map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.slug}`}
                      className="card group flex items-center justify-between p-4 transition-all hover:border-[rgba(0,229,255,0.2)] hover:bg-[#1a1a28]"
                    >
                      <div>
                        <span className="text-sm font-medium text-[#e0e0e8] transition-colors group-hover:text-[#00e5ff]">
                          {post.title}
                        </span>
                        <div className="mt-1 text-xs text-[#606078]">
                          {post.author?.username} · {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <Heart size={14} className="text-[#ff2d95]" fill="#ff2d95" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
