import { useState, useEffect } from 'react';

/**
 * 回到顶部按钮的可见性 Hook
 * 当页面滚动超过 threshold（默认 300px）时，visible 变为 true
 * @param threshold 触发显示的最小滚动距离
 */
export function useScrollTop(threshold = 300) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', handleScroll, { passive: true }); // passive 提升性能
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return { visible, scrollToTop };
}
