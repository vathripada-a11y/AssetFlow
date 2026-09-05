import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import AssetStatusBadge from '../components/AssetStatusBadge';
import AssetHistoryModal from '../components/AssetHistoryModal';

export default function AssetDetails() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    client.get(`/assets/${id}`)
      .then((res) => setAsset(res.data))
      .catch((err) => setError(err.message));

    client.get(`/assets/${id}/history`)
      .then((res) => setHistory(res.data))
      .catch(() => {});
  }, [id]);

  const activeAllocation = history?.allocations?.find((a) => a.status === 'active' || a.status === 'overdue');

  return (
    <div className="asset-details-page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p className="eyebrow">Asset Specification</p>
          <h2 className="page-heading">{asset?.name || 'Loading asset details...'}</h2>
          <p className="page-subtitle">Detailed allocation records, condition status, and audit trail for this resource.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="btn btn-ghost"
            style={{ fontSize: 14 }}
          >
            📜 Full Lifecycle History
          </button>
          <Link to="/assets" className="text-link">← Back to catalog</Link>
        </div>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}

      {asset ? (
        <div className="details-card card">
          <div className="details-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(20,12,60,0.06)' }}>
            <div>
              <span className="hero-tag" style={{ fontSize: 13, background: '#ede9fe', color: '#6d28d9', padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>
                {asset.asset_tag}
              </span>
              <h3 style={{ margin: '8px 0 0', fontSize: 24, color: '#1f1644' }}>{asset.name}</h3>
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

          {/* Quick Stats Summary */}
          {history && (
            <div style={{ background: '#f6f3ff', padding: 20, borderRadius: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 12, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Allocations</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1644' }}>{history.allocations?.length || 0}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maintenance Events</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1644' }}>{history.maintenance?.length || 0}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transfer Requests</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1644' }}>{history.transfers?.length || 0}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audit Findings</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1644' }}>{history.auditFindings?.length || 0}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          Loading asset specification...
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
      <div className="field-title" style={{ fontSize: 12, color: '#6b5fa6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {title}
      </div>
      <div className="field-value" style={{ fontSize: 16, fontWeight: 700, color: '#1f1644' }}>
        {value}
      </div>
    </div>
  );
}
