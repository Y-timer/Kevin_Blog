import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { Post } from '../../types';
import ArticleCard from './ArticleCard';
import { getPosts } from '../../services/post';

interface ArticleListProps {
  search?: string;
  categoryId?: string;
}

export default function ArticleList({ search, categoryId }: ArticleListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['posts', { search, categoryId, page }],
    queryFn: () => getPosts({ page, pageSize: 20, search: search || undefined, categoryId: categoryId || undefined }),
    staleTime: 60 * 1000,
  });

  const posts: Post[] = data?.data?.length ? data.data : [];

  return (
    <section id="articles">
      <h2 className="mb-6 border-l-[3px] border-[#00e5ff] pl-4 text-[1.3rem] font-bold tracking-[0.5px]">最新文章</h2>

      {isLoading && <p className="py-8 text-center text-sm text-[#606078]">加载中...</p>}

      {isError && (
        <div role="alert" className="py-8 text-center text-sm">
          文章列表加载失败。<button onClick={() => void refetch()} className="text-accent-cyan">重试</button>
        </div>
      )}
      {data && posts.length === 0 && <p className="py-8 text-center text-sm text-[#9090a8]">暂无匹配的文章</p>}

      <div className="flex flex-col gap-6">
        {posts.map((post, i) => (
          <ArticleCard key={post.id} post={post} index={i} />
        ))}
      </div>
      {(page > 1 || (data?.pagination.totalPages ?? 0) > 1) && (
        <nav aria-label="文章分页" className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button className="text-accent-cyan disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)}>
            上一页
          </button>
          <span aria-live="polite">第 {page} 页</span>
          <button className="text-accent-cyan disabled:opacity-40" disabled={!data || page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
            下一页
          </button>
        </nav>
      )}
    </section>
  );
}
