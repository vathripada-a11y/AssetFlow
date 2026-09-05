import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
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
    <div className="assets-page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p className="eyebrow">Asset Transfers</p>
          <h2 className="page-heading">Transfer Requests & Reallocations</h2>
          <p className="page-subtitle">Review, approve, or reject asset ownership transfer requests across departments.</p>
        </div>
        <Link to="/dashboard" className="text-link">← Back to dashboard</Link>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
      {message && <p className="form-success" style={{ marginBottom: 16 }}>{message}</p>}

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          Loading transfer requests...
        </div>
      ) : transfers && transfers.length > 0 ? (
        <div className="table-card card">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Req #</th>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>Requested By</th>
                <th>Current Holder</th>
                <th>Status</th>
                <th>Date</th>
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
                        : 'badge-low_stock'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  {isManagerOrAdmin && (
                    <td>
                      {t.status === 'requested' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleApprove(t.id)}
                            disabled={submittingId === t.id}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: 13, width: 'auto' }}
                          >
                            {submittingId === t.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            disabled={submittingId === t.id}
                            className="btn btn-ghost"
                            style={{ padding: '6px 12px', fontSize: 13 }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>Completed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          No transfer requests found.
        </div>
      )}
    </div>
  );
}
