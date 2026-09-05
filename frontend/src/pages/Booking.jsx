import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

export default function Booking() {
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const isManagerOrAdmin = ['admin', 'asset_manager', 'department_head'].includes(user?.role);

  useEffect(() => {
    client.get('/assets')
      .then((res) => {
        const bookables = res.data.filter((a) => a.is_bookable);
        setAssets(bookables);
        if (bookables.length > 0 && !assetId) {
          setAssetId(bookables[0].id);
        }
      })
      .catch(() => {});
  }, []);

  function loadBookings() {
    if (!assetId) return;
    setLoading(true);
    client.get(`/bookings/asset/${assetId}`)
      .then((res) => {
        setBookings(res.data);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load schedule.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
  }, [assetId]);

  async function handleCreateBooking(e) {
    e.preventDefault();
    if (!assetId || !startTime || !endTime) return;
    setSubmitting(true);
    setError('');
    setMessage('');

    if (new Date(startTime) >= new Date(endTime)) {
      setError('Start time must be before end time.');
      setSubmitting(false);
      return;
    }

    try {
      await client.post('/bookings', {
        assetId: Number(assetId),
        startTime,
        endTime
      });
      setMessage('Resource booking confirmed successfully.');
      setStartTime('');
      setEndTime('');
      loadBookings();
    } catch (err) {
      setError(err.message || 'Time slot is unavailable due to an existing booking reservation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelBooking(id) {
    if (!window.confirm('Are you sure you want to cancel this booking reservation?')) return;
    setError('');
    setMessage('');
    try {
      await client.delete(`/bookings/${id}`);
      setMessage('Booking reservation cancelled.');
      loadBookings();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking.');
    }
  }

  const selectedAsset = assets.find((a) => a.id === Number(assetId));

  return (
    <div className="assets-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Time-Slot Reservations</p>
          <h1 className="page-heading">Resource Booking</h1>
          <p className="page-subtitle">Reserve shared conference hardware, testing devices, or lab equipment with conflict protection.</p>
        </div>
        <Link to="/dashboard" className="btn btn-ghost" style={{ fontSize: 13, textDecoration: 'none' }}>
          ← Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {message && <div className="alert alert-success">✓ {message}</div>}

      {/* Booking Form Card */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 18, color: '#1f1644', fontSize: 18, fontWeight: 700 }}>
          Reserve Equipment
        </h2>
        <form onSubmit={handleCreateBooking} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1f1644', marginBottom: 6 }}>
              Select Bookable Asset
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              required
              className="form-input"
            >
              <option value="" disabled>-- Select Resource --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_tag} — {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1f1644', marginBottom: 6 }}>
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1f1644', marginBottom: 6 }}>
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting || !assetId}
              className="btn btn-primary"
              style={{ width: '100%', height: 46 }}
            >
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>

      {/* Bookings Schedule Table */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, color: '#1f1644', fontSize: 18, fontWeight: 700 }}>
          Existing Schedule {selectedAsset ? `for ${selectedAsset.name} (${selectedAsset.asset_tag})` : ''}
        </h2>

        {loading ? (
          <TableSkeleton rows={3} cols={6} />
        ) : bookings.length > 0 ? (
          <div className="table-card">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Reserved By</th>
                  <th>Start Window</th>
                  <th>End Window</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td><strong>{b.booked_by_name || `User #${b.booked_by}`}</strong></td>
                    <td>{new Date(b.start_time).toLocaleString()}</td>
                    <td>{new Date(b.end_time).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        b.status === 'confirmed' || b.status === 'active'
                          ? 'badge-available'
                          : b.status === 'cancelled'
                          ? 'badge-unavailable'
                          : 'badge-low_stock'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {(b.booked_by === user?.id || isManagerOrAdmin) && b.status !== 'cancelled' ? (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span style={{ color: '#948bbd', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="📅"
            title="No scheduled bookings"
            description="No active or upcoming time-slot reservations exist for this resource."
          />
        )}
      </div>
    </div>
  );
}