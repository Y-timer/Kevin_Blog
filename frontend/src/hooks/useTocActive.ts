import { useState, useEffect } from 'react';

/**
 * 文章目录（TOC）高亮追踪 Hook
 * 使用 IntersectionObserver 监听各标题的可见性，自动确定当前阅读位置
 *
 * 核心逻辑：
 * - 遍历所有 tocIds 对应的 DOM 元素，用 observer 监听哪个标题在视口中
 * - rootMargin: '-80px 0px -70% 0px' 表示触发线在视口顶部下方 80px 到视口 30% 处
 *   这意味着标题滚动到导航栏下方 80px 时触发，而不是滚出屏幕才触发
 * - 如果没有标题在视口中（快速滚动场景），则找到当前视口上方最近的标题作为 active
 *
 * @param tocIds 目录项对应的 DOM 元素 ID 数组
 * @returns 当前高亮的标题 ID
 */
export function useTocActive(tocIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = tocIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        let best: string | null = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            best = entry.target.id; // 取最后一个可见的标题
          }
        });

        // 快速滚动时可能所有标题都不在视口内
        // 此时找到当前视口上方最近的标题作为 active
        if (!best) {
          for (let i = headings.length - 1; i >= 0; i--) {
            const rect = headings[i].getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.4) {
              best = headings[i].id;
              break;
            }
          }
        }

        if (best) setActiveId(best);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [tocIds]);

  return activeId;
}
