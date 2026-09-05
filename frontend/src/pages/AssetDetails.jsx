import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import AssetStatusBadge from '../components/AssetStatusBadge';
import AssetHistoryModal from '../components/AssetHistoryModal';
import { TableSkeleton } from '../components/SkeletonLoader';

export default function AssetDetails() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    client.get(`/assets/${id}`)
      .then((res) => setAsset(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    client.get(`/assets/${id}/history`)
      .then((res) => setHistory(res.data))
      .catch(() => {});
  }, [id]);

  const activeAllocation = history?.allocations?.find((a) => a.status === 'active' || a.status === 'overdue');

  return (
    <div className="asset-details-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Asset Specification</p>
          <h1 className="page-heading">{asset?.name || 'Asset Details'}</h1>
          <p className="page-subtitle">Detailed allocation records, condition status, and audit trail for this resource.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="btn btn-ghost"
            style={{ fontSize: 13 }}
            disabled={!asset}
          >
            📜 Full Lifecycle History
          </button>
          <Link to="/assets" className="btn btn-ghost" style={{ fontSize: 13, textDecoration: 'none' }}>
            ← Back to catalog
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <TableSkeleton rows={4} cols={2} />
      ) : asset ? (
        <div className="details-card card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: 13, background: '#f1eaff', color: '#6d28d9', padding: '4px 12px', borderRadius: 6, fontWeight: 800, letterSpacing: '0.04em' }}>
                TAG: {asset.asset_tag}
              </span>
              <h2 style={{ margin: '10px 0 0', fontSize: 24, color: '#1f1644', fontWeight: 800 }}>{asset.name}</h2>
            </div>
            <AssetStatusBadge status={asset.availabilityStatus} quantity={asset.quantity} />
          </div>

          <div className="details-grid" style={{ marginBottom: 28 }}>
            <AssetField title="Category" value={asset.category_name || 'Uncategorized'} />
            <AssetField title="Stock Quantity" value={asset.quantity ?? 0} />
            <AssetField title="Physical Condition" value={asset.condition || 'Good'} />
            <AssetField title="Current Location" value={asset.location || 'Unassigned'} />
            <AssetField title="Serial Number" value={asset.serial_number || 'N/A'} />
            <AssetField title="Bookable Resource" value={asset.is_bookable ? 'Yes (Time-slot)' : 'No'} />
            <AssetField title="Registered Date" value={new Date(asset.created_at).toLocaleDateString()} />
            <AssetField
              title="Current Holder"
              value={activeAllocation ? `${activeAllocation.employee_name} (${activeAllocation.department_name || 'Dept'})` : 'Available / Unassigned'}
            />
          </div>

          {/* Lifecycle Overview Metrics */}
          {history && (
            <div style={{ background: '#f6f3ff', padding: 20, borderRadius: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, border: '1px solid rgba(123,91,255,0.1)' }}>
              <div>
                <span style={{ fontSize: 11, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Allocations</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1f1644', marginTop: 4 }}>{history.allocations?.length || 0}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Maintenance Tickets</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1f1644', marginTop: 4 }}>{history.maintenance?.length || 0}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Transfers</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1f1644', marginTop: 4 }}>{history.transfers?.length || 0}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Audit Records</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1f1644', marginTop: 4 }}>{history.auditFindings?.length || 0}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          Asset specification not found.
        </div>
      )}

      {showHistoryModal && asset && (
        <AssetHistoryModal
          asset={asset}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}

function AssetField({ title, value }) {
  return (
    <div className="detail-card">
      <div className="field-title" style={{ fontSize: 11, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>
        {title}
      </div>
      <div className="field-value" style={{ fontSize: 15, fontWeight: 700, color: '#1f1644' }}>
        {value}
      </div>
    </div>
  );
}
