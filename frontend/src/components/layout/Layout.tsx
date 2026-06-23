import { Outlet } from 'react-router-dom';
import ParticleBackground from './ParticleBackground';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <ParticleBackground />
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
