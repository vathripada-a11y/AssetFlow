import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const KPI_LABELS = {
  totalAssets: 'Total Assets',
  availableAssets: 'Available Assets',
  lowStockAssets: 'Low Stock Assets',
  unavailableAssets: 'Unavailable Assets',
  maintenanceToday: 'Maintenance Requests',
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
      .catch((err) => setError(err.message || 'Failed to load KPIs.'));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAssetManager = user?.role === 'asset_manager';
  const isDeptHead = user?.role === 'department_head';
  const isManagerOrAdmin = isAdmin || isAssetManager || isDeptHead;

  return (
    <div className="dashboard-page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* Hero Welcome Card */}
      <div className="hero-card card" style={{ marginBottom: 28 }}>
        <div>
          <p className="eyebrow">Executive Overview</p>
          <h2 className="page-heading">Welcome back, {user?.name}</h2>
          <p className="page-subtitle">
            Keep a real-time pulse on equipment availability, low stock alerts, active transfers, and maintenance operations.
          </p>
        </div>
        <div className="hero-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <span className="hero-tag" style={{
            background: 'linear-gradient(135deg, #7b5bff, #b990ff)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            padding: '6px 14px',
            borderRadius: 999,
            textTransform: 'uppercase'
          }}>
            Role: {user?.role}
          </span>
          {user?.department_name && (
            <span style={{ fontSize: 13, color: '#6b5fa6' }}>
              Dept: {user.department_name}
            </span>
          )}
        </div>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 20 }}>{error}</p>}

      {/* KPI Cards Grid */}
      <div className="dashboard-grid" style={{ marginBottom: 32 }}>
        {kpis ? (
          Object.entries(KPI_LABELS).map(([key, label]) => (
            <div key={key} className="kpi-card card">
              <div className="kpi-value">{kpis[key] ?? 0}</div>
              <div className="kpi-label">{label}</div>
            </div>
          ))
        ) : (
          <div className="card" style={{ padding: 40, gridColumn: '1 / -1', textAlign: 'center', color: '#6b5fa6' }}>
            Loading live operational metrics...
          </div>
        )}
      </div>

      {/* Role-Aware Operations Shortcuts */}
      <div className="card" style={{ padding: 28, marginBottom: 32 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1f1644', fontSize: 18 }}>
          Quick Action Workflows
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <QuickActionCard
            title="Asset Catalog"
            desc="Browse inventory, filter availability, allocate & request transfers."
            link="/assets"
            actionText="View Assets →"
          />
          <QuickActionCard
            title="Bookings & Reservations"
            desc="Reserve bookable hardware & equipment for time slots."
            link="/booking"
            actionText="Book Resource →"
          />
          <QuickActionCard
            title="Maintenance & Repairs"
            desc="Report issues, track progress, and assign technicians."
            link="/maintenance"
            actionText="View Maintenance →"
          />

          {isManagerOrAdmin && (
            <QuickActionCard
              title="Transfer Approvals"
              desc="Review and approve/reject inter-department transfer requests."
              link="/transfers"
              actionText="Review Transfers →"
            />
          )}

          {isManagerOrAdmin && (
            <QuickActionCard
              title="Audits & Discrepancies"
              desc="Conduct inventory audits and record physical findings."
              link="/audits"
              actionText="Manage Audits →"
            />
          )}

          {isManagerOrAdmin && (
            <QuickActionCard
              title="System Activity Log"
              desc="View auditability trail and security history."
              link="/activity"
              actionText="View Logs →"
            />
          )}

          {isAdmin && (
            <QuickActionCard
              title="Org Setup & RBAC"
              desc="Configure departments, categories, and employee roles."
              link="/org-setup"
              actionText="Configure Org →"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, desc, link, actionText }) {
  return (
    <div style={{
      border: '1px solid rgba(20,12,60,0.06)',
      borderRadius: 12,
      padding: 18,
      background: '#f6f3ff',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      gap: 12
    }}>
      <div>
        <strong style={{ fontSize: 15, color: '#1f1644', display: 'block', marginBottom: 4 }}>{title}</strong>
        <p style={{ margin: 0, fontSize: 13, color: '#6b5fa6', lineHeight: 1.5 }}>{desc}</p>
      </div>
      <Link to={link} className="text-link" style={{ fontSize: 13, fontWeight: 700 }}>
        {actionText}
      </Link>
    </div>
  );
}