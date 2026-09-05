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
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: 400,
        maxWidth: '100%',
        height: '100%',
        background: '#fff',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideLeft 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f5f3ff, #faf5ff)'
        }}>
          <h3 style={{ margin: 0, color: '#3b0764', fontSize: 18 }}>Notifications</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', marginTop: 32 }}>Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 48 }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🔔</span>
              <p style={{ fontWeight: 600 }}>No notifications yet</p>
              <p style={{ fontSize: 13 }}>Activity alerts will appear here as updates occur.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: item.is_read ? '#f1f5f9' : '#ddd6fe',
                    background: item.is_read ? '#fff' : '#f5f3ff',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: item.type === 'maintenance' ? '#d97706' : item.type === 'allocation' ? '#059669' : '#7c3aed'
                    }}>
                      {item.type || 'Notice'}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 8px 0', fontSize: 13, color: '#1e293b', lineHeight: 1.4 }}>
                    {item.message}
                  </p>
                  {!item.is_read && (
                    <button
                      onClick={() => markRead(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6d28d9',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
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
