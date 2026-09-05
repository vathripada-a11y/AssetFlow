import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Audits() {
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [discrepancyReport, setDiscrepancyReport] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleScope, setNewCycleScope] = useState('full');

  const [showFindingModal, setShowFindingModal] = useState(false);
  const [findingAssetId, setFindingAssetId] = useState('');
  const [findingResult, setFindingResult] = useState('verified');
  const [findingNotes, setFindingNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = ['admin', 'asset_manager', 'department_head'].includes(user?.role);

  function loadAuditCycles() {
    setLoading(true);
    client.get('/audits')
      .then((res) => {
        setCycles(res.data);
        if (res.data.length > 0 && !selectedCycleId) {
          setSelectedCycleId(res.data[0].id);
        }
      })
      .catch((err) => setError(err.message || 'Failed to load audit cycles.'))
      .finally(() => setLoading(false));
  }

  function loadAssets() {
    client.get('/assets').then((res) => setAssets(res.data)).catch(() => {});
  }

  useEffect(() => {
    loadAuditCycles();
    loadAssets();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      client.get(`/audits/${selectedCycleId}/discrepancy-report`)
        .then((res) => setDiscrepancyReport(res.data))
        .catch(() => setDiscrepancyReport(null));
    }
  }, [selectedCycleId]);

  async function handleCreateCycle(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await client.post('/audits', {
        scopeLocation: newCycleName,
        startDate: new Date().toISOString().slice(0, 10)
      });
      setMessage('Audit cycle created successfully.');
      setShowCreateModal(false);
      setNewCycleName('');
      loadAuditCycles();
    } catch (err) {
      setError(err.message || 'Failed to create audit cycle.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordFinding(e) {
    e.preventDefault();
    if (!selectedCycleId || !findingAssetId) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await client.post(`/audits/${selectedCycleId}/findings`, {
        assetId: findingAssetId,
        result: findingResult,
        notes: findingNotes
      });
      setMessage('Audit finding recorded successfully.');
      setShowFindingModal(false);
      setFindingAssetId('');
      setFindingNotes('');
      // Reload report
      const res = await client.get(`/audits/${selectedCycleId}/discrepancy-report`);
      setDiscrepancyReport(res.data);
    } catch (err) {
      setError(err.message || 'Failed to record audit finding.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseCycle(id) {
    if (!window.confirm('Are you sure you want to close this audit cycle? This action will finalize all discrepancy findings.')) {
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await client.put(`/audits/${id}/close`);
      setMessage('Audit cycle closed successfully.');
      loadAuditCycles();
    } catch (err) {
      setError(err.message || 'Failed to close audit cycle.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCycle = cycles.find((c) => c.id === Number(selectedCycleId));

  return (
    <div className="assets-page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p className="eyebrow">Audit & Governance</p>
          <h2 className="page-heading">Audit Cycles & Discrepancy Tracking</h2>
          <p className="page-subtitle">Conduct periodic inventory audits, log physical verification findings, and resolve discrepancies.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ width: 'auto' }}
            >
              + New Audit Cycle
            </button>
          )}
          <Link to="/dashboard" className="text-link">← Dashboard</Link>
        </div>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
      {message && <p className="form-success" style={{ marginBottom: 16 }}>{message}</p>}

      {/* Cycle selector cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cycles.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedCycleId(c.id)}
            className="card"
            style={{
              padding: 20,
              cursor: 'pointer',
              border: selectedCycleId === c.id ? '2px solid #7b5bff' : '1px solid rgba(20,12,60,0.06)',
              background: selectedCycleId === c.id ? '#f6f3ff' : '#fff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 16, color: '#1f1644' }}>{c.name || c.title || `Cycle #${c.id}`}</strong>
              <span className={`badge ${c.status === 'in_progress' || c.status === 'active' ? 'badge-available' : 'badge-unavailable'}`}>
                {c.status}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#6b5fa6' }}>
              Scope: {c.scope || 'Full'} • Created: {new Date(c.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
        {cycles.length === 0 && !loading && (
          <div className="card" style={{ padding: 20, gridColumn: '1 / -1', textAlign: 'center', color: '#6b5fa6' }}>
            No audit cycles available yet.
          </div>
        )}
      </div>

      {/* Selected Audit Details & Discrepancy Report */}
      {selectedCycle && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, color: '#1f1644' }}>
                {selectedCycle.name || selectedCycle.title || `Cycle #${selectedCycle.id}`}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b5fa6' }}>
                Discrepancy report and verification records.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {isManagerOrAdmin && (selectedCycle.status === 'in_progress' || selectedCycle.status === 'active') && (
                <button
                  onClick={() => setShowFindingModal(true)}
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: 14 }}
                >
                  + Record Finding
                </button>
              )}
              {isAdmin && (selectedCycle.status === 'in_progress' || selectedCycle.status === 'active') && (
                <button
                  onClick={() => handleCloseCycle(selectedCycle.id)}
                  disabled={submitting}
                  className="btn btn-ghost"
                  style={{ padding: '8px 16px', fontSize: 14, color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  Close Audit Cycle
                </button>
              )}
            </div>
          </div>

          {discrepancyReport ? (
            <div className="table-card">
              <table className="asset-table">
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Asset Name</th>
                    <th>System Status</th>
                    <th>Finding Result</th>
                    <th>Notes</th>
                    <th>Recorded By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {(discrepancyReport.findings || discrepancyReport).map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.asset_tag}</strong></td>
                      <td>{item.asset_name || item.name}</td>
                      <td><span className="badge badge-available">{item.system_status || item.availabilityStatus || 'Active'}</span></td>
                      <td>
                        <span className={`badge ${
                          item.result === 'verified'
                            ? 'badge-available'
                            : item.result === 'missing'
                            ? 'badge-unavailable'
                            : 'badge-low_stock'
                        }`}>
                          {item.result || 'Pending Check'}
                        </span>
                      </td>
                      <td>{item.notes || '—'}</td>
                      <td>{item.recorded_by_name || 'System'}</td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                  {(!discrepancyReport || discrepancyReport.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#6b5fa6' }}>
                        No audit findings logged for this cycle yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#6b5fa6' }}>Loading discrepancy report...</p>
          )}
        </div>
      )}

      {/* Modal: Create Audit Cycle */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: 'min(100%, 480px)', padding: 32 }}>
            <h3 style={{ marginTop: 0, color: '#1f1644' }}>Create Audit Cycle</h3>
            <form onSubmit={handleCreateCycle} className="auth-form">
              <div className="form-row">
                <label>Cycle Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 IT Equipment Physical Audit"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label>Audit Scope</label>
                <select
                  value={newCycleScope}
                  onChange={(e) => setNewCycleScope(e.target.value)}
                  className="form-input"
                >
                  <option value="full">Full Inventory</option>
                  <option value="electronics">Electronics Only</option>
                  <option value="furniture">Furniture Only</option>
                  <option value="vehicles">Vehicles Only</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating...' : 'Create Audit Cycle'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Audit Finding */}
      {showFindingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: 'min(100%, 480px)', padding: 32 }}>
            <h3 style={{ marginTop: 0, color: '#1f1644' }}>Record Audit Finding</h3>
            <form onSubmit={handleRecordFinding} className="auth-form">
              <div className="form-row">
                <label>Select Asset</label>
                <select
                  required
                  value={findingAssetId}
                  onChange={(e) => setFindingAssetId(e.target.value)}
                  className="form-input"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_tag} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Physical Audit Result</label>
                <select
                  value={findingResult}
                  onChange={(e) => setFindingResult(e.target.value)}
                  className="form-input"
                >
                  <option value="verified">Verified (Present & Healthy)</option>
                  <option value="missing">Missing / Unaccounted</option>
                  <option value="damaged">Damaged / Needs Repair</option>
                </select>
              </div>

              <div className="form-row">
                <label>Audit Notes / Observations</label>
                <textarea
                  rows={3}
                  placeholder="Notes on physical condition, serial number check, or location discrepancies..."
                  value={findingNotes}
                  onChange={(e) => setFindingNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Record Finding'}
                </button>
                <button type="button" onClick={() => setShowFindingModal(false)} className="btn btn-ghost">
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
