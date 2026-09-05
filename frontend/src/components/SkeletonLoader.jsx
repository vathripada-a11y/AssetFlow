import React from 'react';

export function TableSkeleton({ rows = 4, cols = 5 }) {
  return (
    <div className="table-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="skeleton skeleton-text"
                style={{ flex: 1, height: 20, marginBottom: 0, opacity: c === 0 ? 1 : 0.7 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="dashboard-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card skeleton-card skeleton" style={{ padding: 24 }} />
      ))}
    </div>
  );
}
