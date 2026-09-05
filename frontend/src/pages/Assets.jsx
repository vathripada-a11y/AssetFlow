import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AssetStatusBadge from '../components/AssetStatusBadge';
import AssetHistoryModal from '../components/AssetHistoryModal';
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
      // Find active allocation ID or return via backend
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
    if (!window.confirm(`Request transfer for asset ${asset.asset_tag} (${asset.name})?`)) return;
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
    <div className="assets-page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Asset Catalog</p>
          <h2 className="page-heading">Manage Inventory Availability</h2>
          <p className="page-subtitle">Browse assets, filter by category/status, allocate equipment, or review history.</p>
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
          <Link to="/dashboard" className="text-link">← Dashboard</Link>
        </div>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
      {message && <p className="form-success" style={{ marginBottom: 16 }}>{message}</p>}

      {/* Filter Controls */}
      <div className="card" style={{ padding: 18, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by tag, name, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1, minWidth: 220 }}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: 160 }}
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
        >
          <option value="">All Availability</option>
          <option value="available">Available</option>
          <option value="allocated">Allocated</option>
          <option value="maintenance">In Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      {/* Assets Table */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          Loading asset catalog...
        </div>
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
                      <Link to={`/assets/${asset.id}`} className="text-link" style={{ fontSize: 13 }}>
                        Details
                      </Link>

                      <button
                        onClick={() => setHistoryAsset(asset)}
                        className="btn btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        History
                      </button>

                      {isManagerOrAdmin && asset.availabilityStatus === 'available' && (
                        <button
                          onClick={() => { setTargetAsset(asset); setShowAllocateModal(true); }}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: 12, width: 'auto' }}
                        >
                          Allocate
                        </button>
                      )}

                      {isManagerOrAdmin && (asset.availabilityStatus === 'allocated' || asset.availabilityStatus === 'low_stock') && (
                        <button
                          onClick={() => { setTargetAsset(asset); setShowReturnModal(true); }}
                          className="btn btn-ghost"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          Return
                        </button>
                      )}

                      {(asset.availabilityStatus === 'allocated' || asset.availabilityStatus === 'low_stock') && (
                        <button
                          onClick={() => handleTransferRequest(asset)}
                          className="btn btn-ghost"
                          style={{ padding: '4px 10px', fontSize: 12 }}
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
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          No assets found matching your criteria.
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: 'min(100%, 520px)', padding: 32 }}>
            <h3 style={{ marginTop: 0, color: '#1f1644' }}>Register New Asset</h3>
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row">
                <label>Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro M3 16-inch"
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
                  <label>Condition</label>
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
                    placeholder="e.g. Building A - Floor 3"
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
                  placeholder="e.g. C02G1234MD6R"
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
                <label htmlFor="bookable-check" style={{ margin: 0, cursor: 'pointer' }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: 'min(100%, 480px)', padding: 32 }}>
            <h3 style={{ marginTop: 0, color: '#1f1644' }}>Allocate Asset</h3>
            <p style={{ color: '#6b5fa6', fontSize: 14 }}>
              Allocating <strong>{targetAsset.asset_tag} — {targetAsset.name}</strong>
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
                      {emp.name} ({emp.department_name || 'No Dept'})
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: 'min(100%, 480px)', padding: 32 }}>
            <h3 style={{ marginTop: 0, color: '#1f1644' }}>Return Asset</h3>
            <p style={{ color: '#6b5fa6', fontSize: 14 }}>
              Marking <strong>{targetAsset.asset_tag} — {targetAsset.name}</strong> as returned.
            </p>
            <form onSubmit={handleReturn} className="auth-form">
              <div className="form-row">
                <label>Return Condition & Inspection Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Good condition, returned with all original cables."
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
