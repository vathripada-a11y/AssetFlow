import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import NotificationsModal from './NotificationsModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function fetchNotifications() {
    if (!user) return;
    client.get('/notifications')
      .then((res) => {
        const unread = res.data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isAssetManager = user.role === 'asset_manager';
  const isDeptHead = user.role === 'department_head';
  const isManagerOrAdmin = isAdmin || isAssetManager || isDeptHead;

  return (
    <>
      <header
        aria-label="Main Navigation"
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(225, 215, 245, 0.7)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '10px 24px'
        }}
      >
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Brand Logo */}
          <Link
            to="/dashboard"
            aria-label="AssetFlow Home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              color: '#1f1644',
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: '-0.02em'
            }}
          >
            <span style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7b5bff, #9333ea)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(123, 91, 255, 0.3)',
              fontSize: 18
            }}>⚡</span>
            <span>AssetFlow</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <NavLink to="/dashboard" current={location.pathname}>Dashboard</NavLink>
            <NavLink to="/assets" current={location.pathname}>Assets</NavLink>
            <NavLink to="/booking" current={location.pathname}>Bookings</NavLink>
            <NavLink to="/maintenance" current={location.pathname}>Maintenance</NavLink>
            {isManagerOrAdmin && <NavLink to="/transfers" current={location.pathname}>Transfers</NavLink>}
            {isManagerOrAdmin && <NavLink to="/audits" current={location.pathname}>Audits</NavLink>}
            {isManagerOrAdmin && <NavLink to="/activity" current={location.pathname}>Activity Logs</NavLink>}
            {isAdmin && <NavLink to="/org-setup" current={location.pathname}>Org Setup</NavLink>}
          </nav>

          {/* Actions & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowNotifications(true)}
              aria-label={`Notifications (${unreadCount} unread)`}
              className="btn btn-ghost"
              style={{
                position: 'relative',
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: 16
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 10,
                  padding: '2px 6px',
                  lineHeight: 1,
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile User Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(245, 243, 255, 0.9)',
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid rgba(221, 214, 254, 0.7)'
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#7b5bff',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1f1644' }}>
                {user.name}
              </span>
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 6,
                background: '#ede9fe',
                color: '#6d28d9',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                {user.role.replace('_', ' ')}
              </span>
            </div>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="btn btn-ghost"
              style={{
                padding: '7px 12px',
                fontSize: 13,
                color: '#64748b'
              }}
            >
              Log out
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
              aria-label="Toggle navigation menu"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer',
                color: '#1f1644'
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu Dropdown */}
        {mobileMenuOpen && (
          <div style={{
            padding: '12px 0 8px',
            borderTop: '1px solid #e2d7fe',
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <MobileNavLink to="/dashboard" current={location.pathname}>Dashboard</MobileNavLink>
            <MobileNavLink to="/assets" current={location.pathname}>Assets</MobileNavLink>
            <MobileNavLink to="/booking" current={location.pathname}>Bookings</MobileNavLink>
            <MobileNavLink to="/maintenance" current={location.pathname}>Maintenance</MobileNavLink>
            {isManagerOrAdmin && <MobileNavLink to="/transfers" current={location.pathname}>Transfers</MobileNavLink>}
            {isManagerOrAdmin && <MobileNavLink to="/audits" current={location.pathname}>Audits</MobileNavLink>}
            {isManagerOrAdmin && <MobileNavLink to="/activity" current={location.pathname}>Activity Logs</MobileNavLink>}
            {isAdmin && <MobileNavLink to="/org-setup" current={location.pathname}>Org Setup</MobileNavLink>}
          </div>
        )}
      </header>

      {showNotifications && (
        <NotificationsModal
          onClose={() => { setShowNotifications(false); fetchNotifications(); }}
        />
      )}

      {/* Media query stylesheet override for mobile navbar */}
      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </>
  );
}

function NavLink({ to, current, children }) {
  const active = current === to || (to !== '/dashboard' && current.startsWith(to));
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: '7px 14px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        color: active ? '#7b5bff' : '#475569',
        background: active ? '#f1eaff' : 'transparent',
        transition: 'all 0.15s ease'
      }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, current, children }) {
  const active = current === to || (to !== '/dashboard' && current.startsWith(to));
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: '10px 16px',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: active ? 700 : 500,
        color: active ? '#7b5bff' : '#1f1644',
        background: active ? '#f1eaff' : 'transparent'
      }}
    >
      {children}
    </Link>
  );
}
