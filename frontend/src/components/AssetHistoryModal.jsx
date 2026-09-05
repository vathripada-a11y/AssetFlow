import React, { useState, useEffect } from 'react';
import client from '../api/client';
import AssetStatusBadge from './AssetStatusBadge';

export default function AssetHistoryModal({ assetId, onClose }) {
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState(null);
  const [tab, setTab] = useState('allocations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get(`/assets/${assetId}`),
      client.get(`/assets/${assetId}/history`)
    ])
      .then(([assetRes, historyRes]) => {
        setAsset(assetRes.data);
        setHistory(historyRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [assetId]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div className="card" style={{
        width: 720,
        maxWidth: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 24
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <span className="eyebrow">Asset History Timeline</span>
            <h3 style={{ margin: '4px 0 0 0', color: '#331b58', fontSize: 20 }}>
              {asset ? `${asset.asset_tag} — ${asset.name}` : 'Loading...'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {error && <p className="form-error">{error}</p>}

        {loading ? (
          <p style={{ textAlign: 'center', margin: '32px 0' }}>Loading lifecycle history...</p>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
              {['allocations', 'transfers', 'maintenance', 'auditFindings'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
                    background: 'none',
                    color: tab === t ? '#6d28d9' : '#64748b',
                    fontWeight: tab === t ? 700 : 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {t === 'auditFindings' ? 'Audit Findings' : t}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {tab === 'allocations' && (
                history?.allocations?.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No allocation history recorded.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>
                        <th style={{ padding: 8 }}>Employee / Dept</th>
                        <th style={{ padding: 8 }}>Allocated Date</th>
                        <th style={{ padding: 8 }}>Return Date</th>
                        <th style={{ padding: 8 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history?.allocations?.map((al) => (
                        <tr key={al.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                          <td style={{ padding: 8 }}>{al.employee_name || al.department_name || 'Unassigned'}</td>
                          <td style={{ padding: 8 }}>{new Date(al.allocated_at).toLocaleDateString()}</td>
                          <td style={{ padding: 8 }}>{al.returned_at ? new Date(al.returned_at).toLocaleDateString() : '—'}</td>
                          <td style={{ padding: 8 }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                              background: al.status === 'active' ? '#dcfce7' : '#f1f5f9',
                              color: al.status === 'active' ? '#15803d' : '#64748b'
                            }}>
                              {al.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {tab === 'transfers' && (
                history?.transfers?.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No transfer request history.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>
                        <th style={{ padding: 8 }}>Requester</th>
                        <th style={{ padding: 8 }}>Current Holder</th>
                        <th style={{ padding: 8 }}>Date</th>
                        <th style={{ padding: 8 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history?.transfers?.map((tr) => (
                        <tr key={tr.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                          <td style={{ padding: 8 }}>{tr.requested_by_name || '—'}</td>
                          <td style={{ padding: 8 }}>{tr.current_holder_name || '—'}</td>
                          <td style={{ padding: 8 }}>{new Date(tr.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f5f3ff', color: '#6d28d9' }}>
                              {tr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {tab === 'maintenance' && (
                history?.maintenance?.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No maintenance records.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>
                        <th style={{ padding: 8 }}>Issue</th>
                        <th style={{ padding: 8 }}>Priority</th>
                        <th style={{ padding: 8 }}>Raised By</th>
                        <th style={{ padding: 8 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history?.maintenance?.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                          <td style={{ padding: 8 }}>{m.issue_description}</td>
                          <td style={{ padding: 8 }}>{m.priority}</td>
                          <td style={{ padding: 8 }}>{m.raised_by_name || '—'}</td>
                          <td style={{ padding: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#fef3c7', color: '#b45309' }}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {tab === 'auditFindings' && (
                history?.auditFindings?.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No audit findings recorded.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>
                        <th style={{ padding: 8 }}>Result</th>
                        <th style={{ padding: 8 }}>Notes</th>
                        <th style={{ padding: 8 }}>Recorded By</th>
                        <th style={{ padding: 8 }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history?.auditFindings?.map((af) => (
                        <tr key={af.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                          <td style={{ padding: 8 }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                              background: af.result === 'verified' ? '#dcfce7' : af.result === 'missing' ? '#fee2e2' : '#fef3c7',
                              color: af.result === 'verified' ? '#15803d' : af.result === 'missing' ? '#b91c1c' : '#b45309'
                            }}>
                              {af.result}
                            </span>
                          </td>
                          <td style={{ padding: 8 }}>{af.notes || '—'}</td>
                          <td style={{ padding: 8 }}>{af.recorded_by_name || '—'}</td>
                          <td style={{ padding: 8 }}>{new Date(af.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
