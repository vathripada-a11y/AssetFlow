import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AssetStatusBadge from '../components/AssetStatusBadge';

export default function Assets() {
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/assets')
      .then((res) => setAssets(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="assets-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Asset Catalog</p>
          <h2 className="page-heading">Manage inventory availability</h2>
          <p className="page-subtitle">Browse every asset, review stock levels, and jump to details in a modern overview.</p>
        </div>
        <Link to="/dashboard" className="text-link">
          ← Back to dashboard
        </Link>
      </div>

      {error && <p className="form-error">{error}</p>}

      {assets ? (
        <div className="table-card">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Availability</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.asset_tag}</td>
                  <td>{asset.name}</td>
                  <td>{asset.category_name || 'Uncategorized'}</td>
                  <td>{asset.quantity ?? 0}</td>
                  <td><AssetStatusBadge status={asset.availabilityStatus} quantity={asset.quantity} /></td>
                  <td>
                    <Link to={`/assets/${asset.id}`} className="table-link">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading assets...</p>
      )}
    </div>
  );
}
