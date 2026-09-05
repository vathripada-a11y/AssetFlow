import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Maintenance() {
  const [requests, setRequests] = useState(null);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Modal & form states
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  // Technician assignment inline
  const [techInput, setTechInput] = useState({});

  const { user } = useAuth();
  const isManagerOrAdmin = ['admin', 'asset_manager'].includes(user?.role);

  function loadData() {
    setLoading(true);
    client.get('/maintenance')
      .then((res) => {
        setRequests(res.data);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load maintenance requests.'))
      .finally(() => setLoading(false));

    client.get('/assets').then((r) => setAssets(r.data)).catch(() => {});
    client.get('/org/employees').then((r) => setTechnicians(r.data)).catch(() => {});
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRaiseRequest(e) {
    e.preventDefault();
    if (!assetId || !issueDescription) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await client.post('/maintenance', {
        assetId: Number(assetId),
        issueDescription,
        priority
      });
      setMessage('Maintenance request raised successfully.');
      setShowRaiseModal(false);
      setAssetId('');
      setIssueDescription('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to raise maintenance request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id, action, extraPayload = {}) {
    setActionId(id);
    setError('');
    setMessage('');
    try {
      await client.put(`/maintenance/${id}/${action}`, extraPayload);
      setMessage(`Maintenance request marked as ${action.replace('-', ' ')}.`);
      loadData();
    } catch (err) {
      setError(err.message || `Failed to process ${action}.`);
    } finally {
      setActionId(null);
    }
  }

  const filteredRequests = requests
    ? requests.filter((r) => {
        if (activeTab === 'pending') return r.status === 'pending';
        if (activeTab === 'approved') return r.status === 'approved';
        if (activeTab === 'in_progress') return r.status === 'in_progress' || r.status === 'in-progress';
        if (activeTab === 'resolved') return r.status === 'resolved';
        return true;
      })
    : [];

  return (
    <div className="assets-page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Maintenance & Repair</p>
          <h2 className="page-heading">Maintenance Operations</h2>
          <p className="page-subtitle">Report hardware issues, track repairs, assign technicians, and restore equipment to service.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setShowRaiseModal(true)}
            className="btn btn-primary"
            style={{ width: 'auto' }}
          >
            + Raise Request
          </button>
          <Link to="/dashboard" className="text-link">← Dashboard</Link>
        </div>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
      {message && <p className="form-success" style={{ marginBottom: 16 }}>{message}</p>}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'in_progress', 'resolved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: 13,
              borderRadius: 8,
              background: activeTab === tab ? '#7b5bff' : '#ffffff',
              color: activeTab === tab ? '#ffffff' : '#1f1644',
              border: activeTab === tab ? 'none' : '1px solid rgba(20,12,60,0.08)'
            }}
          >
            {tab.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Maintenance Table */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          Loading maintenance requests...
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="table-card card">
          <table className="asset-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Asset</th>
                <th>Issue Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Date Raised</th>
                {isManagerOrAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>
                    <strong>{r.asset_tag}</strong>
                    <div style={{ fontSize: 12, color: '#6b5fa6' }}>{r.asset_name}</div>
                  </td>
                  <td style={{ maxWidth: 220 }}>{r.issue_description}</td>
                  <td>
                    <span className={`badge ${
                      r.priority === 'high'
                        ? 'badge-unavailable'
                        : r.priority === 'medium'
                        ? 'badge-low_stock'
                        : 'badge-available'
                    }`}>
                      {r.priority}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-available">
                      {r.status}
                    </span>
                  </td>
                  <td>{r.assigned_technician || r.technician_name || 'Unassigned'}</td>
                  <td style={{ fontSize: 13, color: '#6b5fa6' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  {isManagerOrAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(r.id, 'approve')}
                              disabled={actionId === r.id}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(r.id, 'reject')}
                              disabled={actionId === r.id}
                              className="btn btn-ghost"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {r.status === 'approved' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <select
                              value={techInput[r.id] || ''}
                              onChange={(e) => setTechInput({ ...techInput, [r.id]: e.target.value })}
                              style={{ fontSize: 12, padding: 4, borderRadius: 6, border: '1px solid #ccc' }}
                            >
                              <option value="">Choose Tech</option>
                              {technicians.map((t) => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAction(r.id, 'in-progress', { technicianName: techInput[r.id] })}
                              disabled={actionId === r.id}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                            >
                              Start
                            </button>
                          </div>
                        )}

                        {(r.status === 'in_progress' || r.status === 'in-progress') && (
                          <button
                            onClick={() => handleAction(r.id, 'resolve')}
                            disabled={actionId === r.id}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: 12, width: 'auto', background: '#16a34a' }}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          No maintenance requests found in this category.
        </div>
      )}

      {/* Modal: Raise Maintenance Request */}
      {showRaiseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: 'min(100%, 480px)', padding: 32 }}>
            <h3 style={{ marginTop: 0, color: '#1f1644' }}>Raise Maintenance Request</h3>
            <form onSubmit={handleRaiseRequest} className="auth-form">
              <div className="form-row">
                <label>Select Asset</label>
                <select
                  required
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="form-input"
                >
                  <option value="">-- Select Asset --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_tag} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="form-input"
                >
                  <option value="low">Low (Cosmetic / Non-blocking)</option>
                  <option value="medium">Medium (Standard Repair)</option>
                  <option value="high">High (Urgent / System Down)</option>
                </select>
              </div>

              <div className="form-row">
                <label>Issue Description & Symptoms</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe hardware malfunction, physical damage, or error code..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => setShowRaiseModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}