import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const KPI_LABELS = {
  totalAssets: 'Total Assets',
  availableAssets: 'Available Assets',
  lowStockAssets: 'Low Stock Assets',
  unavailableAssets: 'Unavailable Assets',
  maintenanceToday: 'Maintenance Today',
  activeBookings: 'Active Bookings',
  pendingTransfers: 'Pending Transfers',
  overdueReturns: 'Overdue Returns'
};

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    client.get('/dashboard/kpis')
      .then((res) => setKpis(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
<<<<<<< HEAD
    <div className="dashboard-page">
      <div className="hero-card card">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 className="page-heading">Welcome back, {user?.name}</h2>
          <p className="page-subtitle">
            Keep a pulse on asset availability, low stock alerts, and operations from one secure place.
          </p>
        </div>
        <div className="hero-actions">
          <span className="hero-tag">Role: {user?.role}</span>
          <button onClick={logout} className="btn btn-ghost">
            Log out
          </button>
        </div>
      </div>
=======
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h2>Welcome, {user?.name} ({user?.role})</h2>
>>>>>>> af7954805b81b11320d15f36809d1b7c08b89d76

      {error && <p className="form-error">{error}</p>}

      <div className="dashboard-grid">
        {kpis
          ? Object.entries(KPI_LABELS).map(([key, label]) => (
              <div key={key} className="kpi-card card">
                <div className="kpi-value">{kpis[key] ?? 0}</div>
                <div className="kpi-label">{label}</div>
              </div>
            ))
          : <p>Loading KPIs...</p>}
      </div>

      <div className="dashboard-footer card">
        <p>Need a closer look? Explore the full asset catalog and review availability at a glance.</p>
        <a href="/assets" className="text-link">View full asset catalog →</a>
      </div>
    </div>
  );
}