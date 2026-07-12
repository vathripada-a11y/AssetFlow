const pool = require('../config/db');

async function raiseRequest({ assetId, raisedBy, issueDescription, priority, photoUrl }) {
  const [result] = await pool.query(
    `INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority, photo_url, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [assetId, raisedBy, issueDescription, priority || 'medium', photoUrl || null]
  );
  return { id: result.insertId };
}

async function listRequests(filters = {}) {
  let query = `
    SELECT m.*, a.asset_tag, a.name AS asset_name, e.name AS raised_by_name
    FROM maintenance_requests m
    JOIN assets a ON m.asset_id = a.id
    JOIN employees e ON m.raised_by = e.id
    WHERE 1=1
  `;
  const params = [];
  if (filters.status) {
    query += ' AND m.status = ?';
    params.push(filters.status);
  }
  query += ' ORDER BY m.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

// Approving a request is what flips the asset to Under Maintenance —
// never before approval, per the mandatory workflow rule.
async function approveRequest(requestId, approvedBy) {
  const [rows] = await pool.query('SELECT * FROM maintenance_requests WHERE id = ?', [requestId]);
  if (rows.length === 0) {
    const err = new Error('Maintenance request not found.');
    err.status = 404;
    throw err;
  }
  await pool.query(
    "UPDATE maintenance_requests SET status = 'approved', approved_by = ? WHERE id = ?",
    [approvedBy, requestId]
  );
  await pool.query("UPDATE assets SET status = 'under_maintenance' WHERE id = ?", [rows[0].asset_id]);
}

async function rejectRequest(requestId, approvedBy) {
  await pool.query(
    "UPDATE maintenance_requests SET status = 'rejected', approved_by = ? WHERE id = ?",
    [approvedBy, requestId]
  );
}

async function assignTechnician(requestId, technicianName) {
  await pool.query(
    "UPDATE maintenance_requests SET status = 'technician_assigned', technician_name = ? WHERE id = ?",
    [technicianName, requestId]
  );
}

async function markInProgress(requestId) {
  await pool.query("UPDATE maintenance_requests SET status = 'in_progress' WHERE id = ?", [requestId]);
}

// Resolving flips the asset back to Available.
async function resolveRequest(requestId) {
  const [rows] = await pool.query('SELECT * FROM maintenance_requests WHERE id = ?', [requestId]);
  if (rows.length === 0) {
    const err = new Error('Maintenance request not found.');
    err.status = 404;
    throw err;
  }
  await pool.query(
    "UPDATE maintenance_requests SET status = 'resolved', resolved_at = NOW() WHERE id = ?",
    [requestId]
  );
  await pool.query("UPDATE assets SET status = 'available' WHERE id = ?", [rows[0].asset_id]);
}

module.exports = {
  raiseRequest,
  listRequests,
  approveRequest,
  rejectRequest,
  assignTechnician,
  markInProgress,
  resolveRequest
};
