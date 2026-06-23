import { useState, useEffect, useRef } from 'react';

/**
 * 数字滚动动画 Hook
 * 当绑定的 DOM 元素进入视口时，触发从 0 到 end 的数字增长动画
 *
 * @param end        目标数字
 * @param duration   动画持续时间（毫秒），默认 2000
 * @param startOnView 是否等待元素进入视口才触发，默认 true
 * @returns count - 当前显示的数字, ref - 绑定到目标元素的 ref
 */
export function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView); // 是否已触发动画
  const ref = useRef<HTMLDivElement>(null);

  // 使用 IntersectionObserver 监听元素是否进入视口
  // threshold: 0.3 表示元素 30% 可见时触发
  useEffect(() => {
    const el = ref.current;
    if (!el || !startOnView || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect(); // 触发后立即断开，只执行一次
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnView, started]);

  // 数字增长动画核心：使用 requestAnimationFrame + easeOutCubic 缓动
  // easeOutCubic: 1 - (1-t)^3 —— 开始快，结束慢，视觉上更自然
  useEffect(() => {
    if (!started) return;

    let startTime: number | null = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  return { count, ref };
}
