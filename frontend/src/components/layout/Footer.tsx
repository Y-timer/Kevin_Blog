export default function Footer() {
  return (
    <footer
      className="relative z-10 border-t"
      style={{
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
        background: '#111118',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div className="grid grid-cols-1 gap-9 pt-10 pb-[30px] sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h5 className="mb-4 text-[0.95rem] font-bold text-[#e0e0e8]">导航</h5>
            <ul className="flex list-none flex-col gap-2">
              <li>
                <a
                  href="/#home"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  首页
                </a>
              </li>
              <li>
                <a
                  href="/#articles"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  全部文章
                </a>
              </li>
              <li>
                <a
                  href="/#categories"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  分类归档
                </a>
              </li>
              <li>
                <a
                  href="/#about"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  关于作者
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="mb-4 text-[0.95rem] font-bold text-[#e0e0e8]">专栏</h5>
            <ul className="flex list-none flex-col gap-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  AI 工程化实践
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  云原生架构设计
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  前端性能优化
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  安全攻防笔记
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="mb-4 text-[0.95rem] font-bold text-[#e0e0e8]">社交</h5>
            <ul className="flex list-none flex-col gap-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  掘金
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-[#606078] transition-colors hover:text-[#00e5ff]"
                  style={{ textShadow: 'none' }}
                >
                  RSS 订阅
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-5 text-center" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <p className="text-[0.82rem] text-[#606078]">
            <span
              className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: '#00e5ff',
                animation: 'glowDot 2s ease-in-out infinite',
              }}
            />
            KevinBlog &copy; {new Date().getFullYear()} · Built with passion &amp; code
            <span
              className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: '#00e5ff',
                animation: 'glowDot 2s ease-in-out infinite',
              }}
            />
          </p>
        </div>
      </div>
    </footer>
  );
}
