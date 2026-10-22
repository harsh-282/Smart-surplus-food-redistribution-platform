import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import OfflineBanner from '../components/common/OfflineBanner';
import useScrollReveal from '../utils/useScrollReveal';

const PublicLayout = () => {
  const location = useLocation();
  useScrollReveal([location.pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <OfflineBanner />
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div key={location.pathname} className="page-transition-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;

