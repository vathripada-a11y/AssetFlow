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

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isAssetManager = user.role === 'asset_manager';
  const isDeptHead = user.role === 'department_head';
  const isManagerOrAdmin = isAdmin || isAssetManager || isDeptHead;

  return (
    <>
      <header className="navbar-container" style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(225, 215, 245, 0.6)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Brand Logo */}
          <Link to="/dashboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: '#331b58',
            fontWeight: 800,
            fontSize: 20
          }}>
            <span style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
            }}>⚡</span>
            <span>AssetFlow</span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <NavLink to="/dashboard" current={location.pathname}>Dashboard</NavLink>
            <NavLink to="/assets" current={location.pathname}>Assets</NavLink>
            <NavLink to="/booking" current={location.pathname}>Bookings</NavLink>
            <NavLink to="/maintenance" current={location.pathname}>Maintenance</NavLink>
            {isManagerOrAdmin && <NavLink to="/transfers" current={location.pathname}>Transfers</NavLink>}
            {isManagerOrAdmin && <NavLink to="/audits" current={location.pathname}>Audits</NavLink>}
            {isManagerOrAdmin && <NavLink to="/activity" current={location.pathname}>Activity Logs</NavLink>}
            {isAdmin && <NavLink to="/org-setup" current={location.pathname}>Org Setup</NavLink>}
          </nav>

          {/* Profile & Notifications Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowNotifications(true)}
              style={{
                position: 'relative',
                background: 'rgba(237, 233, 254, 0.6)',
                border: '1px solid rgba(196, 181, 253, 0.5)',
                borderRadius: 10,
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#4c1d95'
              }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '2px 6px',
                  lineHeight: 1
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(245, 243, 255, 0.8)',
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid rgba(221, 214, 254, 0.6)'
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4c1d95' }}>
                {user.name}
              </span>
              <span style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 6,
                background: '#ddd6fe',
                color: '#5b21b6',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {user.role}
              </span>
            </div>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{
                background: 'transparent',
                border: '1px solid #cbd5e1',
                padding: '7px 14px',
                borderRadius: 8,
                color: '#64748b',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {showNotifications && (
        <NotificationsModal
          onClose={() => { setShowNotifications(false); fetchNotifications(); }}
        />
      )}
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
        color: active ? '#6d28d9' : '#475569',
        background: active ? 'rgba(237, 233, 254, 0.8)' : 'transparent',
        transition: 'all 0.15s ease'
      }}
    >
      {children}
    </Link>
  );
}
