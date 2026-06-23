import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useCountUp } from '../../hooks/useCountUp';

function StatCounter({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) {
  const { count, ref } = useCountUp(end);
  const display = end >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}${suffix}`;

  return (
    <div ref={ref} className="text-center">
      <div className="gradient-text-mono text-[2rem] font-extrabold" style={{ fontFamily: 'var(--font-mono)' }}>
        {display}
      </div>
      <div className="text-[0.8rem] tracking-[1px] text-[#606078] uppercase">{label}</div>
    </div>
  );
}

export default function Hero() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="relative overflow-hidden pt-20 pb-[60px] text-center">
      {/* Radial glow behind hero */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(180, 77, 255, 0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Badge */}
        <span
          className="mb-7 inline-block rounded-[20px] border border-[rgba(0,229,255,0.25)] px-[18px] py-[6px] text-[0.82rem] tracking-[2px] text-[#00e5ff] uppercase"
          style={{
            fontFamily: 'var(--font-mono)',
            animation: 'pulseBorder 2.5s ease-in-out infinite',
          }}
        >
          Version 2.0 · 现已上线
        </span>

        {/* Title */}
        <h1 className="mb-[18px] text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.25] font-extrabold tracking-[-0.5px]">
          探索<span className="gradient-text">技术前沿</span>
          <br />
          记录思考与创造
        </h1>

        {/* Slogan */}
        <p
          className="mb-9 text-[1.12rem] leading-[1.8] text-[#9090a8]"
          style={{ maxWidth: '580px', margin: '0 auto 36px' }}
        >
          在代码与架构的交汇处，分享关于 AI、Web 开发、系统设计与安全攻防的深度思考与实战经验。
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-12">
          <StatCounter end={stats?.posts || 0} label="文章" />
          <StatCounter end={stats?.users || 0} label="用户" />
          <StatCounter end={0} suffix="+" label="持续更新" />
        </div>
      </div>
    </section>
  );
}
