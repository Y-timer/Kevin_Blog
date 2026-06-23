import { useNavigate } from 'react-router-dom';
import type { Post } from '../../types';

/**
 * 文章卡片组件
 *
 * 交互设计：
 * - 整个卡片可点击 → navigate 到 /post/:slug
 * - 标签点击 → e.stopPropagation() 阻止冒泡，避免触发卡片导航
 * - hover 效果通过 group class 联动内部元素 + onMouseEnter/Leave 控制 boxShadow
 */

const categoryStyles: Record<string, string> = {
  'AI & ML': 'bg-[rgba(0,229,255,0.12)] text-[#00e5ff]',
  'Web Dev': 'bg-[rgba(0,255,136,0.12)] text-[#00ff88]',
  Security: 'bg-[rgba(255,45,149,0.12)] text-[#ff2d95]',
  DevOps: 'bg-[rgba(255,109,58,0.12)] text-[#ff6d3a]',
};

interface ArticleCardProps {
  post: Post;
  index: number;
}

function readingTime(content: string): number {
  const wordsPerMin = 300;
  return Math.max(1, Math.ceil(content.length / wordsPerMin));
}

export default function ArticleCard({ post, index }: ArticleCardProps) {
  const navigate = useNavigate();
  const catClass = categoryStyles[post.category?.name || ''] || 'bg-[rgba(0,229,255,0.12)] text-[#00e5ff]';
  const postUrl = `/post/${post.slug}`;

  const handleCardClick = () => {
    navigate(postUrl);
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Future: navigate to tag filter page
  };

  return (
    <article
      onClick={handleCardClick}
      className="card group relative cursor-pointer overflow-hidden px-[30px] py-[28px] transition-all duration-300 hover:-translate-y-[2px] hover:border-[rgba(0,229,255,0.25)] hover:bg-[#1a1a28]"
      style={{
        animationDelay: `${index * 0.1}s`,
        boxShadow: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 0 30px rgba(0,229,255,0.15), 0 0 60px rgba(180,77,255,0.08), 0 4px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,229,255,0.03)] to-[rgba(180,77,255,0.03)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Title */}
      <h3 className="relative z-10 mb-[10px] text-[1.22rem] leading-[1.4] font-bold">
        <span className="text-[#e0e0e8] transition-colors group-hover:text-[#00e5ff]">{post.title}</span>
      </h3>

      {/* Excerpt —— 优先用后端存好的摘课文，否则从正文去除 Markdown 语法后截取 */}
      <p className="relative z-10 mb-4 text-[0.94rem] leading-[1.75] text-[#9090a8]">
        {post.excerpt ||
          (() => {
            const txt = post.content || '';
            return txt
              .replace(/^#{1,6}\s+|^\*\*|^__|^[*\->]|`{1,3}/gm, '')
              .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
              .replace(/\n+/g, ' ')
              .trim()
              .slice(0, 130);
          })() ||
          '暂无摘要'}
        ...
      </p>

      {/* Meta */}
      <div className="relative z-10 flex flex-wrap items-center gap-4 text-[0.82rem] text-[#606078]">
        <span className="font-[var(--font-mono)]" style={{ fontFamily: 'var(--font-mono)' }}>
          {new Date(post.createdAt).toLocaleDateString('zh-CN')}
        </span>
        <span>{readingTime(post.content)} min read</span>
        <div className="flex flex-wrap gap-2">
          {post.tags?.map((tag) => (
            <span
              key={tag.id}
              onClick={handleTagClick}
              className="cursor-pointer rounded-[10px] bg-[rgba(255,255,255,0.04)] px-[10px] py-[2px] text-[0.76rem] text-[#606078] transition-colors hover:bg-[rgba(0,229,255,0.1)] hover:text-[#00e5ff]"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Read more + Category */}
      <div className="relative z-10 mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-[6px] text-[0.88rem] font-semibold text-[#00e5ff] transition-all duration-300">
          阅读全文
          <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
        </span>
        {post.category && (
          <span
            className={`inline-block rounded-xl px-3 py-[3px] text-[0.75rem] font-[var(--font-mono)] font-semibold tracking-[1px] ${catClass}`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {post.category.name}
          </span>
        )}
      </div>
    </article>
  );
}
