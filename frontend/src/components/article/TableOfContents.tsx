import { useTocActive } from '../../hooks/useTocActive';

interface TocItem {
  id: string;
  label: string;
  indent?: boolean;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const ids = items.map((item) => item.id);
  const activeId = useTocActive(ids);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const offset = 90;
      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <ul className="flex list-none flex-col gap-[2px]">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(e) => handleClick(e, item.id)}
            className="block rounded-md border-l-2 border-transparent px-3.5 py-[7px] text-[0.84rem] leading-[1.5] text-[#606078] transition-all duration-300 hover:border-l-[rgba(0,229,255,0.3)] hover:bg-[rgba(0,229,255,0.04)] hover:text-[#00e5ff]"
            style={{
              paddingLeft: item.indent ? '26px' : '14px',
              color: activeId === item.id ? '#00e5ff' : undefined,
              background: activeId === item.id ? 'rgba(0,229,255,0.06)' : undefined,
              borderLeftColor: activeId === item.id ? '#00e5ff' : undefined,
              fontWeight: activeId === item.id ? 600 : undefined,
            }}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
