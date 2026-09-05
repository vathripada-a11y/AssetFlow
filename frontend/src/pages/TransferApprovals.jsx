import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

export default function TransferApprovals() {
  const [transfers, setTransfers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const { user } = useAuth();

  const isManagerOrAdmin = ['admin', 'asset_manager', 'department_head'].includes(user?.role);

  function loadTransfers() {
    setLoading(true);
    client.get('/assets/transfer-requests')
      .then((res) => {
        setTransfers(res.data);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Failed to load transfer requests.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTransfers();
  }, []);

  async function handleApprove(id) {
    setSubmittingId(id);
    setError('');
    setMessage('');
    try {
      await client.put(`/assets/transfer-requests/${id}/approve`);
      setMessage(`Transfer request #${id} approved successfully.`);
      loadTransfers();
    } catch (err) {
      setError(err.message || 'Failed to approve transfer request.');
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleReject(id) {
    setSubmittingId(id);
    setError('');
    setMessage('');
    try {
      await client.put(`/assets/transfer-requests/${id}/reject`);
      setMessage(`Transfer request #${id} rejected.`);
      loadTransfers();
    } catch (err) {
      setError(err.message || 'Failed to reject transfer request.');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="assets-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Asset Transfers</p>
          <h1 className="page-heading">Transfer Approvals & Reallocations</h1>
          <p className="page-subtitle">Review, approve, or reject asset ownership transfer requests across departments.</p>
        </div>
        <Link to="/dashboard" className="btn btn-ghost" style={{ fontSize: 13, textDecoration: 'none' }}>
          ← Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {message && <div className="alert alert-success">✓ {message}</div>}

      {loading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : transfers && transfers.length > 0 ? (
        <div className="table-card card">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>Requested By</th>
                <th>Current Holder</th>
                <th>Status</th>
                <th>Date Submitted</th>
                {isManagerOrAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td><strong>{t.asset_tag}</strong></td>
                  <td>{t.asset_name}</td>
                  <td>{t.requester_name}</td>
                  <td>{t.current_holder_name || 'Unassigned'}</td>
                  <td>
                    <span className={`badge ${
                      t.status === 'reallocated' || t.status === 'approved'
                        ? 'badge-available'
                        : t.status === 'rejected'
                        ? 'badge-unavailable'
                        : 'badge-pending'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: '#6b5fa6' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  {isManagerOrAdmin && (
                    <td>
                      {t.status === 'requested' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleApprove(t.id)}
                            disabled={submittingId === t.id}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: 12, width: 'auto' }}
                          >
                            {submittingId === t.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            disabled={submittingId === t.id}
                            className="btn btn-danger"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#948bbd', fontSize: 12 }}>Completed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon="🔄"
            title="No transfer requests"
            description="There are currently no asset transfer requests requiring review."
          />
        </div>
      )}
    </div>
  );
}
