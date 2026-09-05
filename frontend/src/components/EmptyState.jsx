import React from 'react';

export default function EmptyState({ icon = '📦', title = 'No records found', description = 'There are no items to display at this time.', actionText, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" role="img" aria-label={title}>{icon}</span>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary" style={{ width: 'auto', margin: '0 auto' }}>
          {actionText}
        </button>
      )}
    </div>
  );
}
