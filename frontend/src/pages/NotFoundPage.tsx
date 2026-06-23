import { Link } from 'react-router-dom';
import ParticleBackground from '../components/layout/ParticleBackground';

export default function NotFoundPage() {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <ParticleBackground />
      <div className="relative z-10 text-center">
        <div
          className="gradient-text mb-4 text-[8rem] font-extrabold leading-none"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          404
        </div>
        <p className="mb-2 text-xl font-bold text-[#e0e0e8]">页面不存在</p>
        <p className="mb-8 text-sm text-[#606078]">你访问的页面已被移除或从未存在过</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#b44dff] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:shadow-[0_0_24px_rgba(0,229,255,0.3)]"
        >
          &larr; 返回首页
        </Link>
      </div>
    </div>
  );
}
