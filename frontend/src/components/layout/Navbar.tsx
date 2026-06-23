import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';

const navLinks = [
  { to: '/#home', label: '首页' },
  { to: '/#articles', label: '文章' },
  { to: '/#categories', label: '分类' },
  { to: '/#about', label: '关于' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const userMenuRef = useRef<HTMLLIElement>(null);
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="glass fixed top-0 right-0 left-0 z-100 border-b transition-all duration-300"
      style={{
        borderBottomColor: scrolled ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
        boxShadow: scrolled ? '0 1px 20px rgba(0, 229, 255, 0.08)' : 'none',
      }}
    >
      <div className="mx-auto flex items-center justify-between px-6" style={{ maxWidth: '1280px', height: '64px' }}>
        <Link
          to="/"
          className="gradient-text relative text-[1.6rem] font-extrabold tracking-[1px]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          KevinBlog
          <span
            className="absolute left-0"
            style={{
              bottom: '-4px',
              width: '100%',
              height: '2px',
              background: 'linear-gradient(90deg, #00e5ff, #b44dff)',
              borderRadius: '1px',
            }}
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden list-none items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.to}
                className={cn(
                  'rounded-3xl px-[18px] py-2 text-[0.92rem] font-medium tracking-[0.3px] transition-all duration-300',
                  location.hash === link.to || (link.to === '/#home' && !location.hash && pathname === '/')
                    ? 'bg-[rgba(0,229,255,0.08)] text-[#00e5ff]'
                    : 'text-[#9090a8] hover:bg-[rgba(0,229,255,0.08)] hover:text-[#00e5ff] hover:[text-shadow:0_0_12px_#00e5ff]',
                )}
                style={
                  location.hash === link.to || (link.to === '/#home' && !location.hash && pathname === '/')
                    ? { textShadow: '0 0 12px #00e5ff', boxShadow: '0 0 16px rgba(0,229,255,0.06)' }
                    : {}
                }
              >
                {link.label}
              </a>
            </li>
          ))}
          {isAuthenticated && user ? (
            <li className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-[rgba(0,229,255,0.3)] text-sm font-bold text-white transition-all hover:border-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.3)]"
                style={{ background: 'linear-gradient(135deg, #00e5ff, #b44dff)' }}
              >
                {user.username.charAt(0).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div className="card absolute top-full right-0 z-50 mt-2 w-36 rounded-xl py-2 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
                  <Link
                    to="/user/center"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[#9090a8] transition-all hover:bg-[rgba(0,229,255,0.04)] hover:text-[#00e5ff]"
                  >
                    用户中心
                  </Link>
                  <Link
                    to="/editor"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[#9090a8] transition-all hover:bg-[rgba(0,229,255,0.04)] hover:text-[#00e5ff]"
                  >
                    写文章
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#9090a8] transition-all hover:bg-[rgba(255,45,149,0.04)] hover:text-[#ff2d95]"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </li>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className="rounded-3xl px-[18px] py-2 text-[0.92rem] font-medium tracking-[0.3px] text-[#9090a8] transition-all duration-300 hover:bg-[rgba(0,229,255,0.08)] hover:text-[#00e5ff] hover:[text-shadow:0_0_12px_#00e5ff]"
                >
                  登录
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="rounded-3xl px-5 py-2 text-[0.92rem] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                  style={{ background: 'linear-gradient(135deg, #00e5ff, #b44dff)' }}
                >
                  注册
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex cursor-pointer flex-col gap-[5px] border-none bg-transparent p-1 md:hidden"
          aria-label="菜单"
        >
          <span className="block h-[2px] w-[26px] rounded-[2px] bg-[#e0e0e8] transition-all duration-300" />
          <span className="block h-[2px] w-[26px] rounded-[2px] bg-[#e0e0e8] transition-all duration-300" />
          <span className="block h-[2px] w-[26px] rounded-[2px] bg-[#e0e0e8] transition-all duration-300" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="border-b md:hidden"
          style={{
            background: 'rgba(10, 10, 15, 0.96)',
            backdropFilter: 'blur(20px)',
            borderBottomColor: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex flex-col gap-1 py-5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.to}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-center text-[#9090a8] transition-all hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff]"
              >
                {link.label}
              </a>
            ))}
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/user/center"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-center text-[#9090a8] transition-all hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff]"
                >
                  用户中心
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="mx-4 rounded-3xl border border-[rgba(255,45,149,0.2)] px-5 py-3 text-center text-[0.92rem] font-semibold text-[#ff2d95]"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-center text-[#9090a8] transition-all hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff]"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="mx-4 rounded-3xl px-5 py-3 text-center text-[0.92rem] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #00e5ff, #b44dff)' }}
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
