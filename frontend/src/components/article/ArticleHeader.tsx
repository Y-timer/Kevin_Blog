interface ArticleHeaderProps {
  category: string;
  categoryClass: string;
  title: string;
  subtitle: string;
  author: string;
  authorInitials: string;
  date: string;
  readTime: string;
}

const categoryMap: Record<string, string> = {
  'AI & ML': 'bg-[rgba(0,229,255,0.12)] text-[#00e5ff] border-[rgba(0,229,255,0.2)]',
  'Web Dev': 'bg-[rgba(0,255,136,0.12)] text-[#00ff88] border-[rgba(0,255,136,0.2)]',
  Security: 'bg-[rgba(255,45,149,0.12)] text-[#ff2d95] border-[rgba(255,45,149,0.2)]',
  DevOps: 'bg-[rgba(255,109,58,0.12)] text-[#ff6d3a] border-[rgba(255,109,58,0.2)]',
};

export default function ArticleHeader({
  category,
  title,
  subtitle,
  author,
  authorInitials,
  date,
  readTime,
}: ArticleHeaderProps) {
  const catClass = categoryMap[category] || categoryMap['AI & ML'];

  return (
    <header
      className="border-border-border-subtle relative mb-10 border-b py-12.5 pb-7.5"
      style={{ opacity: 1, transform: 'none' }}
    >
      <span
        className={`mb-5 inline-block rounded-[14px] border px-4 py-1.25 text-[0.78rem] font-[var(--font-mono)] font-semibold tracking-[1.5px] ${catClass}`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {category}
      </span>

      <h1
        className="mb-5 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[1.35] font-extrabold tracking-[-0.5px]"
        style={{
          background: 'linear-gradient(135deg, #e0e0e8 0%, #00e5ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {title}
      </h1>

      <p className="text-text-secondary mb-6 max-w-170 text-[1.05rem] leading-[1.8]">{subtitle}</p>

      <div className="flex flex-wrap items-center gap-4 text-[0.88rem] text-[#606078]">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[0.9rem] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #00e5ff, #b44dff)' }}
        >
          {authorInitials}
        </div>
        <span className="font-semibold text-[#e0e0e8]">{author}</span>
        <span className="h-1 w-1 rounded-full bg-[#606078]" />
        <span className="font-[var(--font-mono)]" style={{ fontFamily: 'var(--font-mono)' }}>
          {date}
        </span>
        <span className="h-1 w-1 rounded-full bg-[#606078]" />
        <span>{readTime}</span>
      </div>
    </header>
  );
}
