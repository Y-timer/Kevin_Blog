import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPosts, getCategories } from '../../services/post';
import api from '../../services/api';
import { useState } from 'react';
import type { Category, Tag } from '../../types';

interface SidebarProps {
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
  activeCategoryId?: string;
  onSearch?: (query: string) => void;
}

const categoryColors = ['#00e5ff', '#00ff88', '#ff2d95', '#ff6d3a', '#b44dff', '#ffcc00', '#00ffcc', '#ff8800'];

export default function Sidebar({ onCategoryClick, activeCategoryId, onSearch }: SidebarProps) {
  const [searchInput, setSearchInput] = useState('');

  const { data: recentData } = useQuery({
    queryKey: ['recentPosts'],
    queryFn: () => getPosts({ pageSize: 5 }),
    staleTime: 60 * 1000,
  });
  const recentPosts = recentData?.data?.slice(0, 5) || [];

  // 从 API 加载分类数据（含 ID）
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000,
  });
  const categories = (catData || []).map((c, index) => ({
    ...c,
    color: categoryColors[index % categoryColors.length],
  }));

  // 从 API 加载标签列表
  const { data: tagData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<{ data: Tag[] }>('/tags').then((r) => r.data.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = () => {
    if (onSearch && searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <aside className="flex flex-col gap-7" id="categories">
      {/* 搜索框 */}
      {onSearch && (
        <div className="card p-6">
          <h4 className="mb-[18px] flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3 text-base font-bold before:h-[18px] before:w-1 before:rounded-sm before:bg-[#00e5ff] before:content-['']">
            搜索文章
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="输入关键词..."
              className="flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-3.5 py-2.5 text-sm text-[#e0e0e8] transition-all outline-none focus:border-[#00e5ff] focus:shadow-[0_0_12px_rgba(0,229,255,0.12)]"
            />
            <button
              onClick={handleSearch}
              className="rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#b44dff] px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
            >
              搜索
            </button>
          </div>
        </div>
      )}

      {/* About author */}
      <div className="card p-6">
        <h4 className="mb-[18px] flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3 text-base font-bold before:h-[18px] before:w-1 before:rounded-sm before:bg-[#00e5ff] before:content-['']">
          关于作者
        </h4>
        <p className="text-[0.9rem] leading-relaxed text-[#9090a8]">
          全栈工程师 & 网络安全爱好者，专注于 <span className="font-semibold text-[#00e5ff]">Web 全栈开发</span>、{' '}
          <span className="font-semibold text-[#00e5ff]">云原生架构</span> 与{' '}
          <span className="font-semibold text-[#00e5ff]">安全攻防</span>。 「未知攻，焉知防」——
          以攻防视角构建更安全的系统。
        </p>
      </div>

      {/* Categories */}
      <div className="card p-6">
        <h4 className="mb-[18px] flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3 text-base font-bold before:h-[18px] before:w-1 before:rounded-sm before:bg-[#00e5ff] before:content-['']">
          文章分类
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryClick?.('', '全部')}
            className={`cursor-pointer rounded-2xl border-2 px-3.5 py-1.5 text-xs font-bold transition-all ${!activeCategoryId ? 'border-[#00e5ff] bg-[rgba(0,229,255,0.06)] text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.08)]' : 'border-[rgba(255,255,255,0.06)] text-[#9090a8] hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.08)]'}`}
          >
            全部
          </button>
          {categories.map((cat: Category & { color: string }) => (
            <button
              key={cat.id}
              onClick={() => onCategoryClick?.(cat.id, cat.name)}
              className={`cursor-pointer rounded-2xl border-2 px-3.5 py-1.5 text-xs font-bold transition-all ${activeCategoryId === cat.id ? 'border-[#00e5ff] bg-[rgba(0,229,255,0.06)] text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.08)]' : 'border-[rgba(255,255,255,0.06)] text-[#9090a8] hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.08)]'}`}
            >
              {cat.name} ({cat._count?.posts || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Recent posts */}
      <div className="card p-6">
        <h4 className="mb-[18px] flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3 text-base font-bold before:h-[18px] before:w-1 before:rounded-sm before:bg-[#00e5ff] before:content-['']">
          近期文章
        </h4>
        <ul className="flex flex-col gap-3.5">
          {recentPosts.map((post) => (
            <li key={post.id}>
              <Link
                to={`/post/${post.slug}`}
                className="flex flex-col gap-1 rounded-lg px-3 py-2.5 text-[0.9rem] text-[#9090a8] transition-all hover:bg-[rgba(0,229,255,0.04)] hover:text-[#e0e0e8]"
              >
                {post.title}
                <span
                  className="text-[0.74rem] font-[var(--font-mono)] text-[#606078]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Tag cloud */}
      <div className="card p-6">
        <h4 className="mb-[18px] flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3 text-base font-bold before:h-[18px] before:w-1 before:rounded-sm before:bg-[#00e5ff] before:content-['']">
          标签云
        </h4>
        <div className="flex flex-wrap gap-2">
          {(tagData || []).map((tag) => (
            <a
              key={tag.id}
              href={`#${tag.name}`}
              className="rounded-2xl border border-[rgba(255,255,255,0.06)] px-3.5 py-1.5 text-xs text-[#9090a8] transition-all hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.08)]"
            >
              {tag.name}
            </a>
          ))}
        </div>
      </div>

      {/* Subscribe */}
      <div className="card p-6">
        <h4 className="mb-[18px] flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3 text-base font-bold before:h-[18px] before:w-1 before:rounded-sm before:bg-[#00e5ff] before:content-['']">
          订阅更新
        </h4>
        <p className="mb-3.5 text-sm text-[#9090a8]">每周推送精选技术文章，绝无垃圾邮件。</p>
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-3.5 py-2.5 text-sm text-[#e0e0e8] transition-all outline-none focus:border-[#00e5ff] focus:shadow-[0_0_12px_rgba(0,229,255,0.12)]"
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#b44dff] px-[18px] py-2.5 text-sm font-semibold whitespace-nowrap text-white transition-all duration-300 hover:-translate-y-px hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
          >
            订阅
          </button>
        </form>
      </div>
    </aside>
  );
}
