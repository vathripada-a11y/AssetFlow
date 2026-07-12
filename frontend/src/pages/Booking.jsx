import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Booking() {
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    client.get('/assets?status=available').then((r) => {
      setAssets(r.data.filter((a) => a.is_bookable));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (assetId) {
      client.get(`/bookings/asset/${assetId}`).then((r) => setBookings(r.data)).catch(() => {});
    } else {
      setBookings([]);
    }
  }, [assetId, message]);

  async function createBooking(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post('/bookings', { assetId, startTime, endTime });
      setMessage('Booking confirmed.');
      setStartTime(''); setEndTime('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h2>Resource Booking</h2>

      <form onSubmit={createBooking} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <select value={assetId} onChange={(e) => setAssetId(e.target.value)} required style={{ padding: 8 }}>
          <option value="">Select bookable resource</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
        </select>
        <input type="datetime-local" value={startTime}
          onChange={(e) => setStartTime(e.target.value)} required style={{ padding: 8 }} />
        <input type="datetime-local" value={endTime}
          onChange={(e) => setEndTime(e.target.value)} required style={{ padding: 8 }} />
        <button type="submit">Book</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {assetId && (
        <>
          <h4>Existing bookings for this resource</h4>
          <ul>
            {bookings.map((b) => (
              <li key={b.id}>
                {new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleString()}
                {' '}— {b.status} (by {b.booked_by_name})
              </li>
            ))}
            {bookings.length === 0 && <li>No bookings yet.</li>}
          </ul>
        </>
      )}
    </div>
  );
}