import { useState, useEffect } from 'react';

/**
 * 阅读进度条 Hook
 * 根据页面滚动位置计算文章阅读进度（0-100%）
 *
 * 原理：监听 window scroll 事件，计算文章内容区域（#articleContent）
 * 相对视口的滚动比例。当用户滚动到文章底部时进度为 100%。
 *
 * @param contentTopOffset 文章内容区域的顶部偏移量（用于修正 sticky 导航栏的影响）
 * @returns 0-100 的进度百分比
 */
export function useReadingProgress(contentTopOffset: number = 0) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const articleContent = document.getElementById('articleContent');
      if (!articleContent) return;

      const scrollTop = window.scrollY;
      const contentTop = articleContent.offsetTop + contentTopOffset; // 文章开始的绝对位置
      const contentHeight = articleContent.offsetHeight; // 文章总高度
      const windowHeight = window.innerHeight; // 视口高度
      // 可滚动的总距离 = 文章高度 - 视口高度 + 文章顶部偏移
      const totalScroll = contentHeight - windowHeight + contentTop;

      if (totalScroll <= 0) {
        setProgress(0);
        return;
      }
      // 当前滚动进度 = (当前滚动位置 - 文章起始位置) / 可滚动总距离
      const pct = Math.min(Math.max((scrollTop - contentTop) / totalScroll, 0), 1);
      setProgress(pct * 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [contentTopOffset]);

  return progress;
}
