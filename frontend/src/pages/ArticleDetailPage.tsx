import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import ParticleBackground from '../components/layout/ParticleBackground';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import ReadingProgress from '../components/article/ReadingProgress';
import ArticleHeader from '../components/article/ArticleHeader';
import CommentSection from '../components/article/CommentSection';
import ArticleSidebar from '../components/article/ArticleSidebar';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { getPostBySlug } from '../services/post';
import MarkdownRenderer from '../components/article/MarkdownRenderer';
import { extractToc } from '../utils/toc';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [scrolled, setScrolled] = useState(false);
  const articleProgress = useReadingProgress();
  const currentUser = useAuthStore((s) => s.user);

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPostBySlug(slug!),
    enabled: !!slug,
    staleTime: 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });

  useDocumentTitle(post?.title);

  // 全局统计数据（用于侧边栏作者卡片）
  const { data: globalStats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then((r) => r.data.data),
  });

  // 相关推荐：同分类文章（或最新文章），排除当前篇
  const { data: relatedPosts } = useQuery({
    queryKey: ['related', post?.categoryId || 'latest', post?.id],
    queryFn: async () => {
      const params: any = { pageSize: 20 };
      if (post?.categoryId) params.categoryId = post.categoryId;
      const { data } = await api.get('/posts', { params });
      const posts = Array.isArray(data?.data) ? data.data : (data?.data?.data || []);
      return posts
        .filter((p: any) => p.id !== post?.id)
        .slice(0, 4)
        .map((p: any) => ({ title: p.title, href: `/post/${p.slug}` }));
    },
    enabled: !!post?.id,
    retry: 2,
  });

  // 前后篇邻接文章
  const { data: neighbors } = useQuery({
    queryKey: ['neighbors', slug],
    queryFn: () => api.get(`/posts/${slug}/neighbors`).then((r) => r.data.data),
    enabled: !!slug,
  });

  // 评论数据
  const qc = useQueryClient();
  const { data: commentData } = useQuery({
    queryKey: ['comments', post?.id],
    queryFn: () => api.get(`/comments/post/${post!.id}`).then((r) => r.data.data || []),
    enabled: !!post?.id,
  });
  const postComments = commentData || [];

  const addCommentMut = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      api.post(`/comments/post/${post!.id}`, { content, parentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', post?.id] }),
  });

  const delCommentMut = useMutation({
    mutationFn: (commentId: string) => api.delete(`/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', post?.id] }),
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.scrollTo(0, 0);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <ParticleBackground />
      <ReadingProgress progress={articleProgress} />

      {/* Navbar */}
      <nav
        className="glass fixed top-0 right-0 left-0 z-100 border-b transition-all duration-300"
        style={{
          borderBottomColor: scrolled ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
          boxShadow: scrolled ? '0 1px 20px rgba(0, 229, 255, 0.08)' : 'none',
        }}
      >
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
          <Link
            to="/"
            className="group inline-flex items-center gap-1 text-[0.88rem] font-semibold text-[#9090a8] transition-all duration-300 hover:text-[#00e5ff]"
          >
            <span className="text-[1.1rem] transition-transform duration-300 group-hover:-translate-x-[3px]">
              &larr;
            </span>
            返回首页
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ paddingTop: '64px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 gap-10 py-5 pb-[60px] lg:grid-cols-[1fr_280px]">
            {/* Article body —— min-w-0 防止长代码/URL 撑破网格，把侧边栏挤出去 */}
            <div className="min-w-0">
              {isLoading && <div className="py-20 text-center text-sm text-[#606078]">加载中...</div>}
              {isError && (
                <div className="py-20 text-center">
                  <p className="mb-3 text-sm text-[#ff2d95]">文章加载失败，请确认后端服务已启动</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-lg border border-[rgba(0,229,255,0.25)] px-5 py-2 text-sm text-[#00e5ff] transition-all hover:bg-[rgba(0,229,255,0.06)]"
                  >
                    重新加载
                  </button>
                </div>
              )}
              {post && currentUser && currentUser.id === post.authorId && (
                <div className="mb-4">
                  <Link
                    to={`/editor/${post.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(0,229,255,0.25)] px-4 py-2 text-sm font-semibold text-[#00e5ff] transition-all hover:bg-[rgba(0,229,255,0.08)] hover:shadow-[0_0_12px_rgba(0,229,255,0.15)]"
                  >
                    &#9998; 编辑文章
                  </Link>
                </div>
              )}
              {post && (
                <ArticleHeader
                  category={post?.category?.name || 'AI & ML'}
                  categoryClass="cat-ai"
                  title={post?.title || '加载中...'}
                  subtitle={post?.excerpt || ''}
                  author={post?.author?.username || 'Nexus'}
                  authorInitials={post?.author?.username?.slice(0, 2).toUpperCase() || 'NX'}
                  date={post?.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN') : ''}
                  readTime={post?.content ? `${Math.max(1, Math.ceil(post.content.length / 300))} min read` : ''}
                />
              )}

              {/* Article content */}
              {post && <MarkdownRenderer content={post.content} />}

              {/* Tags */}
              {post && (
                <div className="my-10 flex flex-wrap gap-2.5 border-y border-[rgba(255,255,255,0.06)] py-6">
                  {(post.tags || []).length > 0 &&
                    post.tags!.map((tag) => (
                      <span
                        key={typeof tag === 'string' ? tag : tag.id}
                        className="cursor-pointer rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-1.5 text-[0.82rem] font-[var(--font-mono)] text-[#606078] transition-all hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff] hover:shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {tag.name || ''}
                      </span>
                    ))}
                </div>
              )}

              {/* Prev / Next nav —— 根据发布时间动态获取前后篇 */}
              <nav className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {neighbors?.prev ? (
                  <Link
                    to={`/post/${neighbors.prev.slug}`}
                    className="card block p-[22px] text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(0,229,255,0.25)]"
                    style={{ boxShadow: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 30px rgba(0,229,255,0.15), 0 0 60px rgba(180,77,255,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div className="mb-1.5 text-[0.76rem] font-[var(--font-mono)] tracking-[1.5px] text-[#606078] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>&larr; 上一篇</div>
                    <div className="text-[0.95rem] leading-[1.4] font-semibold text-[#9090a8]">{neighbors.prev.title}</div>
                  </Link>
                ) : <div />}
                {neighbors?.next ? (
                  <Link
                    to={`/post/${neighbors.next.slug}`}
                    className="card ml-auto block p-[22px] text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(0,229,255,0.25)]"
                    style={{ boxShadow: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 30px rgba(0,229,255,0.15), 0 0 60px rgba(180,77,255,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div className="mb-1.5 text-[0.76rem] font-[var(--font-mono)] tracking-[1.5px] text-[#606078] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>下一篇 &rarr;</div>
                    <div className="text-[0.95rem] leading-[1.4] font-semibold text-[#9090a8]">{neighbors.next.title}</div>
                  </Link>
                ) : <div />}
              </nav>

              {/* Comments */}
              <CommentSection
                comments={postComments}
                isAuthenticated={!!currentUser}
                currentUserId={currentUser?.id}
                postAuthorId={post?.authorId}
                onAdd={async (content, parentId) => {
                  await addCommentMut.mutateAsync({ content, parentId: parentId || undefined });
                }}
                onDelete={async (commentId) => {
                  await delCommentMut.mutateAsync(commentId);
                }}
              />
            </div>

            {/* Sidebar */}
            <ArticleSidebar
              author={{
                initials: post?.author?.username?.slice(0, 2).toUpperCase() || 'NX',
                name: post?.author?.username || 'Nexus',
                bio: post?.author?.bio || '全栈工程师 & 网络安全爱好者，专注于 Web 全栈开发、云原生架构与安全攻防。',
                articles: globalStats?.posts || 0,
                subscribers: globalStats?.users || 0,
                columns: 0,
              }}
              tocItems={post?.content ? extractToc(post.content) : []}
              relatedPosts={relatedPosts || []}
            />
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
