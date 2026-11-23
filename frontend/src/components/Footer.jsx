import { Link, useLocation } from 'react-router-dom';
import { Pizza } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Footer.css';

const Footer = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <div className="footer-logo"><Pizza size={22} aria-hidden="true" /><span>Pizzara</span></div>
          <p>Freshly crafted pizzas, delivered your way.</p>
        </div>
        <div>
          <h2>Explore</h2>
          {user?.role === 'admin' ? (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/inventory">Inventory</Link>
              <Link to="/admin/orders">Orders</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard">Menu</Link>
              <Link to="/build-pizza">Build a pizza</Link>
              <Link to="/my-orders">My orders</Link>
            </>
          )}
        </div>
        <div>
          <h2>Contact</h2>
          <a href="mailto:support@pizzara.com">support@pizzara.com</a>
          <span>Mon–Sun, 10:00–22:00</span>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Pizzara. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
