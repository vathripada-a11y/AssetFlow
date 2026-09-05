import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function ActivityLogs() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    client.get('/notifications/activity')
      .then((res) => {
        setLogs(res.data);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Failed to load activity logs.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs
    ? logs.filter((log) =>
        (log.action || '').toLowerCase().includes(filterText.toLowerCase()) ||
        (log.user_name || '').toLowerCase().includes(filterText.toLowerCase()) ||
        (log.user_email || '').toLowerCase().includes(filterText.toLowerCase())
      )
    : [];

  return (
    <div className="assets-page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p className="eyebrow">Auditability & Security</p>
          <h2 className="page-heading">System Activity Log</h2>
          <p className="page-subtitle">Immutable timeline of asset allocations, lifecycle transitions, role changes, and system events.</p>
        </div>
        <Link to="/dashboard" className="text-link">← Back to dashboard</Link>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Filter search bar */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search activity by user, action, or keyword..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="form-input"
          style={{ maxWidth: 400 }}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          Loading activity logs...
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="table-card card">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Performer</th>
                <th>Role</th>
                <th>Activity Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#6b5fa6' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <strong>{log.user_name || 'System User'}</strong>
                    {log.user_email && <div style={{ fontSize: 12, color: '#94a3b8' }}>{log.user_email}</div>}
                  </td>
                  <td>
                    <span className="badge badge-available" style={{ fontSize: 11, padding: '2px 8px' }}>
                      {log.user_role || 'user'}
                    </span>
                  </td>
                  <td style={{ color: '#1f1644' }}>{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          No activity logs match your search.
        </div>
      )}
    </div>
  );
}
