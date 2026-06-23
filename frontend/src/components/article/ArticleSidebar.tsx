import TableOfContents from './TableOfContents';

interface TocItem {
  id: string;
  label: string;
  indent?: boolean;
}

interface ArticleSidebarProps {
  author: {
    initials: string;
    name: string;
    bio: string;
    articles: number;
    subscribers: string;
    columns: number;
  };
  tocItems: TocItem[];
  relatedPosts: { title: string; href: string }[];
}

export default function ArticleSidebar({ author, tocItems, relatedPosts }: ArticleSidebarProps) {
  return (
    <aside className="flex flex-col gap-7">
      {/* Author Card */}
      <div className="card p-5.5 text-center">
        <div
          className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full text-[1.3rem] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #00e5ff, #b44dff)' }}
        >
          {author.initials}
        </div>
        <div className="mb-2 text-[1.05rem] font-bold">{author.name}</div>
        <p className="text-text-secondary text-[0.84rem] leading-[1.6]">{author.bio}</p>
        <div className="border-border-subtle mt-4 flex justify-center gap-6 border-t pt-3.5">
          <div className="text-center">
            <div
              className="text-accent-cyan text-[1.1rem] font-[var(--font-mono)] font-bold"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {author.articles}
            </div>
            <div className="text-[0.7rem] tracking-[1px] text-[#606078]">文章</div>
          </div>
          <div className="text-center">
            <div
              className="text-accent-cyan text-[1.1rem] font-[var(--font-mono)] font-bold"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {author.subscribers}
            </div>
            <div className="text-[0.7rem] tracking-[1px] text-[#606078]">订阅者</div>
          </div>
          <div className="text-center">
            <div
              className="text-accent-cyan text-[1.1rem] font-[var(--font-mono)] font-bold"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {author.columns}
            </div>
            <div className="text-accent-cyan text-[0.7rem] tracking-[1px]">专栏</div>
          </div>
        </div>
      </div>

      {/* TOC + Related Posts —— 作为整体 sticky，目录在上，推荐在下 */}
      <div className="sticky top-20 flex flex-col gap-7">
        <div className="card p-5.5">
          <h4 className="border-border-subtle before:bg-accent-cyan mb-4 flex items-center gap-2 border-b pb-2.5 text-[0.95rem] font-bold before:h-4 before:w-1 before:rounded-sm before:content-['']">
            目录
          </h4>
          <TableOfContents items={tocItems} />
        </div>

        <div className="card p-5.5">
          <h4 className="border-border-subtle before:bg-accent-cyan mb-4 flex items-center gap-2 border-b pb-2.5 text-[0.95rem] font-bold before:h-4 before:w-1 before:rounded-sm before:content-['']">
            相关推荐
          </h4>
          <ul className="flex list-none flex-col gap-3">
            {relatedPosts.map((post, i) => (
              <li key={i}>
                <a
                  href={post.href}
                  className="text-text-secondary hover:text-text-primary hover:border-border-subtle block rounded-lg border border-transparent px-3.5 py-2.5 text-[0.86rem] leading-normal transition-all hover:bg-[rgba(0,229,255,0.04)]"
                >
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
