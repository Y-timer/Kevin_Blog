import { useScrollTop } from '../../hooks/useScrollTop';
import { cn } from '../../utils/cn';

export default function ScrollToTop() {
  const { visible, scrollToTop } = useScrollTop(500);

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed right-8 bottom-8 z-[99] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[rgba(0,229,255,0.25)] bg-[#14141e] text-[1.2rem] text-[#00e5ff] transition-all duration-300 hover:bg-[rgba(0,229,255,0.1)] hover:shadow-[0_0_24px_rgba(0,229,255,0.3)]',
        visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0',
      )}
      aria-label="回到顶部"
    >
      &#8593;
    </button>
  );
}
