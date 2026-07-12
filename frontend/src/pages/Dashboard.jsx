import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const KPI_LABELS = {
  available: 'Assets Available',
  allocated: 'Assets Allocated',
  maintenanceToday: 'Maintenance Today',
  activeBookings: 'Active Bookings',
  pendingTransfers: 'Pending Transfers',
  overdueReturns: 'Overdue Returns'
};

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    client.get('/dashboard/kpis')
      .then((res) => setKpis(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {user?.name} ({user?.role})</h2>
        <button onClick={logout}>Log out</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
        {kpis
          ? Object.entries(KPI_LABELS).map(([key, label]) => (
              <div key={key} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{kpis[key]}</div>
                <div style={{ color: '#555' }}>{label}</div>
              </div>
            ))
          : <p>Loading KPIs...</p>}
      </div>
    </div>
  );
}
