import { useEffect, useRef } from 'react';

/**
 * 动态粒子背景 —— Canvas 绘制下落粒子 + 连线效果
 *
 * 核心逻辑：
 * - 粒子数量 = (画布面积 / 14000)，上限 120 个
 * - 粒子颜色：50% 青色 (hue 187) + 50% 紫色 (hue 275)，用 HSLA 控制透明度
 * - 粒子从顶部向下飘落，到底部后重置回顶部
 * - 距离 < 120px 的粒子对之间画半透明连线，距离越近线越亮
 * - 窗口 resize 时重新计算粒子数量和位置
 */
export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      hue: number;

      constructor() {
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.speedY = 0;
        this.speedX = 0;
        this.opacity = 0;
        this.hue = 0;
        this.reset();
        this.y = Math.random() * h;
      }

      reset() {
        this.x = Math.random() * w;
        this.y = -10;
        this.size = Math.random() * 1.8 + 0.4;
        this.speedY = Math.random() * 0.4 + 0.15;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.15;
        this.hue = Math.random() < 0.5 ? 187 : 275;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y > h + 10) this.reset();
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${this.opacity})`;
        ctx.fill();
      }
    }

    let particles: Particle[] = [];
    let animationId: number;

    const init = () => {
      resize();
      const count = Math.min(Math.floor((w * h) / 14000), 120);
      particles = Array.from({ length: count }, () => new Particle());
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    init();
    animate();
    window.addEventListener('resize', init);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
}
