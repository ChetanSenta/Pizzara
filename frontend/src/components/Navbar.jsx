import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Package,
  Pizza,
  ShoppingCart,
  Sun,
  X,
} from 'lucide-react';
import './Navbar.css';
import useModalFocus from '../hooks/useModalFocus';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const cart = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeProfile = () => setDropdownOpen(false);
  const dropdown = useModalFocus(dropdownOpen, closeProfile, { fallbackFocus: '#profile-trigger' });

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="nav-brand">
          <Pizza className="nav-brand-icon" size={28} strokeWidth={2.2} aria-hidden="true" />
          <span className="nav-brand-text">Pizzara</span>
        </Link>

        {/* Center nav links */}
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {isAdmin ? (
            <>
              <li><Link to="/admin" className={isActive('/admin') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
              <li><Link to="/admin/inventory" className={isActive('/admin/inventory') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Inventory</Link></li>
              <li><Link to="/admin/orders" className={isActive('/admin/orders') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Orders</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Menu</Link></li>
              <li><Link to="/build-pizza" className={isActive('/build-pizza') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Build Your Pizza</Link></li>
              <li><Link to="/my-orders" className={isActive('/my-orders') ? 'active' : ''} onClick={() => setMenuOpen(false)}>My Orders</Link></li>
            </>
          )}
        </ul>

        {/* Right side controls */}
        <div className="nav-right">
          {!isAdmin && (
            <button id="cart-trigger" className="nav-icon-btn cart-trigger" onClick={() => cart?.setOpen(true)} title="Open cart" aria-label="Open cart">
              <ShoppingCart size={19} strokeWidth={2} aria-hidden="true" />
              {cart?.items?.length ? <span className="nav-cart-count" key={cart.items.reduce((n, item) => n + item.quantity, 0)}>{cart.items.reduce((n, item) => n + item.quantity, 0)}</span> : null}
            </button>
          )}
          {/* Theme toggle */}
          <button className="nav-icon-btn" onClick={toggleTheme} title="Toggle theme" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={19} strokeWidth={2} aria-hidden="true" /> : <Moon size={19} strokeWidth={2} aria-hidden="true" />}
          </button>

          {/* Profile dropdown */}
          <div className="nav-profile">
            <button id="profile-trigger" aria-label="Profile" aria-haspopup="dialog" aria-expanded={dropdownOpen} aria-controls={dropdownOpen ? "profile-dialog" : undefined} className="nav-profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="nav-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <span className="nav-username">{user.name}</span>
              <ChevronDown className={`nav-chevron ${dropdownOpen ? 'open' : ''}`} size={14} aria-hidden="true" />
            </button>

            {dropdownOpen && (
              <>
                <div className="nav-profile-backdrop" onClick={closeProfile} aria-hidden="true" />
                {createPortal(
                  <div className="nav-profile-backdrop nav-profile-page-backdrop" onClick={closeProfile} aria-hidden="true" />,
                  document.body,
                )}
                <div id="profile-dialog" className="nav-dropdown" ref={dropdown} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="profile-title">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div id="profile-title" className="dropdown-name">{user.name}</div>
                      <div className="dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  {!isAdmin && (
                    <Link to="/my-orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Package size={18} aria-hidden="true" /> My Orders
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                    <LogOut className="dropdown-logout-icon" size={18} aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;