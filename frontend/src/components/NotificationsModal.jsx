import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function NotificationsModal({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function fetchNotifications() {
    setLoading(true);
    client.get('/notifications')
      .then((res) => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markRead(id) {
    try {
      await client.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: 420,
        maxWidth: '100%',
        height: '100%',
        background: '#ffffff',
        boxShadow: '-4px 0 32px rgba(32, 14, 80, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2d7fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f6f3ff, #faf5ff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <h3 style={{ margin: 0, color: '#1f1644', fontSize: 18, fontWeight: 700 }}>Notifications</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="btn btn-ghost"
            style={{
              padding: '4px 8px',
              fontSize: 16,
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b5fa6', marginTop: 64 }}>
              <span style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>🔔</span>
              <h4 style={{ margin: '0 0 6px 0', color: '#1f1644', fontSize: 16 }}>No notifications yet</h4>
              <p style={{ margin: 0, fontSize: 13 }}>Operational updates and transfer alerts will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid',
                    borderColor: item.is_read ? 'rgba(20,12,60,0.06)' : 'rgba(123,91,255,0.3)',
                    background: item.is_read ? '#ffffff' : '#f6f3ff',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: item.type === 'maintenance' ? '#d97706' : item.type === 'allocation' ? '#16a34a' : '#7b5bff'
                    }}>
                      {item.type || 'Notice'}
                    </span>
                    <span style={{ fontSize: 11, color: '#948bbd' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 8px 0', fontSize: 13, color: '#1f1644', lineHeight: 1.4, fontWeight: item.is_read ? 400 : 600 }}>
                    {item.message}
                  </p>
                  {!item.is_read && (
                    <button
                      onClick={() => markRead(item.id)}
                      className="btn btn-ghost"
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        color: '#7b5bff'
                      }}
                    >
                      ✓ Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
