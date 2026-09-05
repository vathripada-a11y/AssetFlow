import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import AssetStatusBadge from '../components/AssetStatusBadge';

export default function AssetDetails() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/assets/${id}`)
      .then((res) => setAsset(res.data))
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <div className="asset-details-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Asset Details</p>
          <h2 className="page-heading">{asset?.name || 'Loading asset...'}</h2>
          <p className="page-subtitle">View current availability, tracking metadata, and asset condition.</p>
        </div>
        <Link to="/assets" className="text-link">
          ← Back to catalog
        </Link>
      </div>

      {error && <p className="form-error">{error}</p>}

      {asset ? (
        <div className="details-card card">
          <div className="details-summary">
            <div>
              <div className="asset-meta">{asset.asset_tag}</div>
              <h3>{asset.name}</h3>
            </div>
            <AssetStatusBadge status={asset.availabilityStatus} quantity={asset.quantity} />
          </div>

          <div className="details-grid">
            <AssetField title="Category" value={asset.category_name || 'Uncategorized'} />
            <AssetField title="Quantity" value={asset.quantity ?? 0} />
            <AssetField title="Condition" value={asset.condition || 'Unknown'} />
            <AssetField title="Location" value={asset.location || 'Unassigned'} />
            <AssetField title="Serial Number" value={asset.serial_number || 'N/A'} />
            <AssetField title="Registered" value={new Date(asset.created_at).toLocaleDateString()} />
          </div>
        </div>
      ) : (
        <p>Loading asset details...</p>
      )}
    </div>
  );
}

function AssetField({ title, value }) {
  return (
    <div className="detail-card">
      <div className="field-title">{title}</div>
      <div className="field-value">{value}</div>
    </div>
  );
}
