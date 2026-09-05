import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AssetStatusBadge from '../components/AssetStatusBadge';
import AssetHistoryModal from '../components/AssetHistoryModal';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

export default function Assets() {
  const [assets, setAssets] = useState(null);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected asset for history modal
  const [historyAsset, setHistoryAsset] = useState(null);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [targetAsset, setTargetAsset] = useState(null);

  // Form inputs - Register
  const [regName, setRegName] = useState('');
  const [regCategoryId, setRegCategoryId] = useState('');
  const [regSerialNumber, setRegSerialNumber] = useState('');
  const [regIsBookable, setRegIsBookable] = useState(false);
  const [regLocation, setRegLocation] = useState('');
  const [regQuantity, setRegQuantity] = useState(1);
  const [regCondition, setRegCondition] = useState('good');

  // Form inputs - Allocate
  const [allocEmployeeId, setAllocEmployeeId] = useState('');
  const [allocReturnDate, setAllocReturnDate] = useState('');

  // Form inputs - Return
  const [returnNotes, setReturnNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const isManagerOrAdmin = ['admin', 'asset_manager', 'department_head'].includes(user?.role);
  const canRegister = ['admin', 'asset_manager'].includes(user?.role);

  function loadData() {
    setLoading(true);
    let url = '/assets?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (selectedCategory) url += `categoryId=${encodeURIComponent(selectedCategory)}&`;
    if (selectedStatus) url += `status=${encodeURIComponent(selectedStatus)}&`;

    client.get(url)
      .then((res) => {
        setAssets(res.data);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load assets.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    client.get('/org/categories').then((r) => setCategories(r.data)).catch(() => {});
    client.get('/org/employees').then((r) => setEmployees(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedStatus]);

  async function handleRegister(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await client.post('/assets', {
        name: regName,
        categoryId: regCategoryId ? Number(regCategoryId) : null,
        serialNumber: regSerialNumber,
        isBookable: regIsBookable,
        location: regLocation,
        quantity: Number(regQuantity),
        condition: regCondition
      });
      setMessage('Asset registered successfully.');
      setShowRegisterModal(false);
      setRegName(''); setRegSerialNumber(''); setRegLocation('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to register asset.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAllocate(e) {
    e.preventDefault();
    if (!targetAsset || !allocEmployeeId) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await client.post(`/assets/${targetAsset.id}/allocate`, {
        employeeId: Number(allocEmployeeId),
        expectedReturnDate: allocReturnDate || null
      });
      setMessage(`Asset ${targetAsset.asset_tag} allocated successfully.`);
      setShowAllocateModal(false);
      setTargetAsset(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to allocate asset.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturn(e) {
    e.preventDefault();
    if (!targetAsset) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const historyRes = await client.get(`/assets/${targetAsset.id}/history`);
      const activeAlloc = historyRes.data.allocations?.find((a) => a.status === 'active' || a.status === 'overdue');
      if (!activeAlloc) {
        throw new Error('No active allocation found for this asset.');
      }
      await client.put(`/assets/allocations/${activeAlloc.id}/return`, {
        conditionNotes: returnNotes
      });
      setMessage(`Asset ${targetAsset.asset_tag} marked as returned.`);
      setShowReturnModal(false);
      setTargetAsset(null);
      setReturnNotes('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to return asset.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransferRequest(asset) {
    if (!window.confirm(`Submit transfer request for asset ${asset.asset_tag} (${asset.name})?`)) return;
    setError('');
    setMessage('');
    try {
      await client.post(`/assets/${asset.id}/transfer-request`);
      setMessage(`Transfer request submitted for ${asset.asset_tag}.`);
    } catch (err) {
      setError(err.message || 'Failed to submit transfer request.');
    }
  }

  return (
    <div className="assets-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Asset Management</p>
          <h1 className="page-heading">Inventory Catalog</h1>
          <p className="page-subtitle">Search assets, review stock availability, allocate hardware, or view lifecycle history.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {canRegister && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="btn btn-primary"
              style={{ width: 'auto' }}
            >
              + Register Asset
            </button>
          )}
          <Link to="/dashboard" className="btn btn-ghost" style={{ fontSize: 13, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {message && <div className="alert alert-success">✓ {message}</div>}

      {/* Filter Bar */}
      <div className="card" style={{ padding: 18, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by asset tag, name, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1, minWidth: 240 }}
          aria-label="Search assets"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: 160 }}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: 160 }}
          aria-label="Filter by availability status"
        >
          <option value="">All Availability</option>
          <option value="available">Available</option>
          <option value="allocated">Allocated</option>
          <option value="maintenance">Under Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      {/* Assets Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : assets && assets.length > 0 ? (
        <div className="table-card card">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Quantity</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td><strong>{asset.asset_tag}</strong></td>
                  <td>{asset.name}</td>
                  <td>{asset.category_name || 'Uncategorized'}</td>
                  <td>{asset.location || '—'}</td>
                  <td>{asset.quantity ?? 0}</td>
                  <td>
                    <AssetStatusBadge status={asset.availabilityStatus} quantity={asset.quantity} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Link to={`/assets/${asset.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                        Details
                      </Link>

                      <button
                        onClick={() => setHistoryAsset(asset)}
                        className="btn btn-ghost btn-sm"
                      >
                        History
                      </button>

                      {isManagerOrAdmin && (asset.status === 'available' || asset.availabilityStatus === 'available') && (
                        <button
                          onClick={() => { setTargetAsset(asset); setShowAllocateModal(true); }}
                          className="btn btn-primary btn-sm"
                          style={{ width: 'auto' }}
                        >
                          Allocate
                        </button>
                      )}

                      {isManagerOrAdmin && (asset.status === 'allocated' || asset.availabilityStatus === 'allocated' || asset.availabilityStatus === 'low_stock') && (
                        <button
                          onClick={() => { setTargetAsset(asset); setShowReturnModal(true); }}
                          className="btn btn-ghost btn-sm"
                        >
                          Return
                        </button>
                      )}

                      {(asset.status === 'allocated' || asset.availabilityStatus === 'allocated' || asset.availabilityStatus === 'low_stock') && (
                        <button
                          onClick={() => handleTransferRequest(asset)}
                          className="btn btn-ghost btn-sm"
                          title="Request transfer to yourself"
                        >
                          Transfer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon="📦"
            title="No matching assets found"
            description="No inventory items matched your search query or filter selection."
            actionText="Clear Filters"
            onAction={() => { setSearch(''); setSelectedCategory(''); setSelectedStatus(''); }}
          />
        </div>
      )}

      {/* Modal: History */}
      {historyAsset && (
        <AssetHistoryModal
          asset={historyAsset}
          onClose={() => setHistoryAsset(null)}
        />
      )}

      {/* Modal: Register Asset */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0, color: '#1f1644', fontSize: 20 }}>Register New Asset</h3>
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row">
                <label>Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro M3 Max 16-inch"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' }}>
                <div>
                  <label>Category</label>
                  <select
                    value={regCategoryId}
                    onChange={(e) => setRegCategoryId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Initial Condition</label>
                  <select
                    value={regCondition}
                    onChange={(e) => setRegCondition(e.target.value)}
                    className="form-input"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' }}>
                <div>
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={regQuantity}
                    onChange={(e) => setRegQuantity(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Server Room B - Rack 4"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <label>Serial Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SN-99824-X11"
                  value={regSerialNumber}
                  onChange={(e) => setRegSerialNumber(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="bookable-check"
                  checked={regIsBookable}
                  onChange={(e) => setRegIsBookable(e.target.checked)}
                />
                <label htmlFor="bookable-check" style={{ margin: 0, cursor: 'pointer', fontSize: 13 }}>
                  Enable time-slot resource bookings for this asset
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Registering...' : 'Register Asset'}
                </button>
                <button type="button" onClick={() => setShowRegisterModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Allocate Asset */}
      {showAllocateModal && targetAsset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0, color: '#1f1644', fontSize: 20 }}>Allocate Asset</h3>
            <p style={{ color: '#6b5fa6', fontSize: 14, marginBottom: 20 }}>
              Assigning <strong>{targetAsset.asset_tag} — {targetAsset.name}</strong>
            </p>
            <form onSubmit={handleAllocate} className="auth-form">
              <div className="form-row">
                <label>Assign to Employee</label>
                <select
                  required
                  value={allocEmployeeId}
                  onChange={(e) => setAllocEmployeeId(e.target.value)}
                  className="form-input"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department_name || 'Unassigned Dept'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Expected Return Date (Optional)</label>
                <input
                  type="date"
                  value={allocReturnDate}
                  onChange={(e) => setAllocReturnDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Allocating...' : 'Confirm Allocation'}
                </button>
                <button type="button" onClick={() => { setShowAllocateModal(false); setTargetAsset(null); }} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Return Asset */}
      {showReturnModal && targetAsset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0, color: '#1f1644', fontSize: 20 }}>Return Asset</h3>
            <p style={{ color: '#6b5fa6', fontSize: 14, marginBottom: 20 }}>
              Processing return for <strong>{targetAsset.asset_tag} — {targetAsset.name}</strong>
            </p>
            <form onSubmit={handleReturn} className="auth-form">
              <div className="form-row">
                <label>Return Inspection Notes</label>
                <textarea
                  rows={3}
                  placeholder="Notes on return condition, physical damage, or missing accessories..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Processing...' : 'Confirm Return'}
                </button>
                <button type="button" onClick={() => { setShowReturnModal(false); setTargetAsset(null); }} className="btn btn-ghost">
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
