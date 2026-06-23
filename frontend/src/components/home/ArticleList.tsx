import { useQuery } from '@tanstack/react-query';
import type { Post } from '../../types';
import ArticleCard from './ArticleCard';
import { getPosts } from '../../services/post';

interface ArticleListProps {
  search?: string;
  categoryId?: string;
}

export default function ArticleList({ search, categoryId }: ArticleListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['posts', { search, categoryId }],
    queryFn: () => getPosts({ pageSize: 20, search: search || undefined, categoryId: categoryId || undefined }),
    staleTime: 60 * 1000,
  });

  const posts: Post[] = data?.data?.length ? data.data : [];

  return (
    <section id="articles">
      <h2 className="mb-6 border-l-[3px] border-[#00e5ff] pl-4 text-[1.3rem] font-bold tracking-[0.5px]">最新文章</h2>

      {isLoading && <p className="py-8 text-center text-sm text-[#606078]">加载中...</p>}

      {!isLoading && posts.length === 0 && <p className="py-8 text-center text-sm text-[#606078]">暂无匹配的文章</p>}

      <div className="flex flex-col gap-6">
        {posts.map((post, i) => (
          <ArticleCard key={post.id} post={post} index={i} />
        ))}
      </div>
    </section>
  );
}
