import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';

export default function ActivityLogs() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    setLoading(true);
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
        (log.user_name || log.employee_name || '').toLowerCase().includes(filterText.toLowerCase()) ||
        (log.user_email || log.employee_email || '').toLowerCase().includes(filterText.toLowerCase())
      )
    : [];

  return (
    <div className="assets-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Auditability & Security</p>
          <h1 className="page-heading">System Activity Log</h1>
          <p className="page-subtitle">Immutable timeline of asset allocations, lifecycle transitions, role changes, and system events.</p>
        </div>
        <Link to="/dashboard" className="btn btn-ghost" style={{ fontSize: 13, textDecoration: 'none' }}>
          ← Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Filter search bar */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search activity timeline by user, email, action, or keyword..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="form-input"
          style={{ maxWidth: 460 }}
          aria-label="Search activity logs"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : filteredLogs.length > 0 ? (
        <div className="table-card card">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Performer</th>
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
                    <strong>{log.user_name || log.employee_name || 'System Performer'}</strong>
                    {(log.user_email || log.employee_email) && (
                      <div style={{ fontSize: 12, color: '#948bbd' }}>{log.user_email || log.employee_email}</div>
                    )}
                  </td>
                  <td style={{ color: '#1f1644', lineHeight: 1.4 }}>{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon="🛡️"
            title="No activity records found"
            description="No system security logs match your search filter."
            actionText="Clear Search"
            onAction={() => setFilterText('')}
          />
        </div>
      )}
    </div>
  );
}
