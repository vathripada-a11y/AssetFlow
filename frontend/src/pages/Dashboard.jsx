import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton } from '../components/SkeletonLoader';

const KPI_CONFIG = {
  totalAssets: { label: 'Total Inventory', icon: '📦', color: '#7b5bff' },
  availableAssets: { label: 'Available Assets', icon: '✅', color: '#16a34a' },
  lowStockAssets: { label: 'Low Stock Items', icon: '⚠️', color: '#d97706' },
  unavailableAssets: { label: 'Unavailable / Reserved', icon: '🔒', color: '#dc2626' },
  maintenanceToday: { label: 'Maintenance Requests', icon: '🛠️', color: '#7c3aed' },
  activeBookings: { label: 'Active Bookings', icon: '📅', color: '#2563eb' },
  pendingTransfers: { label: 'Pending Transfers', icon: '🔄', color: '#0284c7' },
  overdueReturns: { label: 'Overdue Returns', icon: '⌛', color: '#ea580c' }
};

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    client.get('/dashboard/kpis')
      .then((res) => {
        setKpis(res.data);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load live metrics.'))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAssetManager = user?.role === 'asset_manager';
  const isDeptHead = user?.role === 'department_head';
  const isManagerOrAdmin = isAdmin || isAssetManager || isDeptHead;

  return (
    <div className="dashboard-page">
      {/* Hero Welcome Card */}
      <div className="hero-card card" style={{ marginBottom: 28 }}>
        <div>
          <p className="eyebrow">Operational Dashboard</p>
          <h1 className="page-heading">Welcome back, {user?.name}</h1>
          <p className="page-subtitle">
            Real-time pulse on inventory availability, active allocations, maintenance tickets, and transfer requests.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{
            background: 'linear-gradient(135deg, #7b5bff, #9333ea)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 12,
            padding: '6px 14px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            boxShadow: '0 4px 12px rgba(123, 91, 255, 0.25)'
          }}>
            Role: {user?.role ? user.role.replace('_', ' ') : 'Employee'}
          </span>
          {user?.department_name && (
            <span style={{ fontSize: 13, color: '#6b5fa6', fontWeight: 600 }}>
              Dept: {user.department_name}
            </span>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>⚠️ {error}</div>}

      {/* KPI Cards Grid */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, color: '#1f1644', marginBottom: 16, fontWeight: 700 }}>
          System Performance & Inventory Summary
        </h2>

        {loading ? (
          <CardSkeleton count={8} />
        ) : kpis ? (
          <div className="dashboard-grid">
            {Object.entries(KPI_CONFIG).map(([key, cfg]) => (
              <div key={key} className="kpi-card card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: `${cfg.color}15`, padding: '2px 8px', borderRadius: 6 }}>
                    Live
                  </span>
                </div>
                <div className="kpi-value">{kpis[key] ?? 0}</div>
                <div className="kpi-label">{cfg.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
            No operational metrics available.
          </div>
        )}
      </div>

      {/* Role-Aware Quick Action Workflows */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: '#1f1644', fontSize: 18, fontWeight: 700 }}>
          Quick Action Workflows
        </h2>
        <p style={{ margin: '0 0 20px 0', color: '#6b5fa6', fontSize: 14 }}>
          Jump directly to key operational modules for your account role.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <QuickActionCard
            icon="📁"
            title="Asset Catalog"
            desc="Browse inventory, filter availability, allocate items & request transfers."
            link="/assets"
            actionText="View Catalog →"
          />
          <QuickActionCard
            icon="🕒"
            title="Bookings & Reservations"
            desc="Reserve bookable hardware & equipment for specific time windows."
            link="/booking"
            actionText="Book Equipment →"
          />
          <QuickActionCard
            icon="🔧"
            title="Maintenance & Repairs"
            desc="Report issues, track repair tickets, and assign technicians."
            link="/maintenance"
            actionText="View Tickets →"
          />

          {isManagerOrAdmin && (
            <QuickActionCard
              icon="🔄"
              title="Transfer Requests"
              desc="Review and approve/reject inter-department transfer requests."
              link="/transfers"
              actionText="Review Transfers →"
            />
          )}

          {isManagerOrAdmin && (
            <QuickActionCard
              icon="📋"
              title="Audits & Discrepancies"
              desc="Conduct inventory audits and log physical verification findings."
              link="/audits"
              actionText="Manage Audits →"
            />
          )}

          {isManagerOrAdmin && (
            <QuickActionCard
              icon="🛡️"
              title="Activity Audit Log"
              desc="Inspect immutable security audit trail and system activity history."
              link="/activity"
              actionText="View Activity →"
            />
          )}

          {isAdmin && (
            <QuickActionCard
              icon="⚙️"
              title="Org Setup & Governance"
              desc="Manage departments, asset categories, and user permissions."
              link="/org-setup"
              actionText="Configure System →"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, desc, link, actionText }) {
  return (
    <div style={{
      border: '1px solid rgba(123, 91, 255, 0.12)',
      borderRadius: 14,
      padding: 20,
      background: 'linear-gradient(180deg, #fcfbff 0%, #f6f3ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 14,
      transition: 'all 0.18s ease'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <strong style={{ fontSize: 16, color: '#1f1644' }}>{title}</strong>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#6b5fa6', lineHeight: 1.5 }}>{desc}</p>
      </div>
      <Link to={link} className="btn btn-ghost" style={{ justifyContent: 'space-between', fontSize: 13, padding: '8px 14px' }}>
        <span>{actionText}</span>
      </Link>
    </div>
  );
}