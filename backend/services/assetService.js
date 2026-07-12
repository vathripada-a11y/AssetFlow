const pool = require('../config/db');
const generateAssetTag = require('../utils/assetTagGenerator');

// ---- Asset Registration & Directory ----
async function registerAsset(data) {
  const assetTag = await generateAssetTag(pool);
  const [result] = await pool.query(
    `INSERT INTO assets
      (asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost,
       \`condition\`, location, is_bookable, status, photo_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?)`,
    [
      assetTag, data.name, data.categoryId || null, data.serialNumber || null,
      data.acquisitionDate || null, data.acquisitionCost || null,
      data.condition || 'good', data.location || null,
      !!data.isBookable, data.photoUrl || null
    ]
  );
  return { id: result.insertId, assetTag };
}

async function listAssets(filters = {}) {
  let query = `
    SELECT a.*, c.name AS category_name
    FROM assets a
    LEFT JOIN asset_categories c ON a.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += ' AND a.status = ?';
    params.push(filters.status);
  }
  if (filters.categoryId) {
    query += ' AND a.category_id = ?';
    params.push(filters.categoryId);
  }
  if (filters.search) {
    query += ' AND (a.asset_tag LIKE ? OR a.serial_number LIKE ? OR a.name LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY a.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

async function getAssetHistory(assetId) {
  const [allocations] = await pool.query(
    `SELECT al.*, e.name AS employee_name, d.name AS department_name
     FROM allocations al
     LEFT JOIN employees e ON al.employee_id = e.id
     LEFT JOIN departments d ON al.department_id = d.id
     WHERE al.asset_id = ? ORDER BY al.allocated_at DESC`,
    [assetId]
  );
  const [maintenance] = await pool.query(
    'SELECT * FROM maintenance_requests WHERE asset_id = ? ORDER BY created_at DESC',
    [assetId]
  );
  return { allocations, maintenance };
}

// ---- Allocation & Transfer ----

// Core business rule: an asset that is already actively allocated cannot be
// allocated again. Instead, the caller is told who holds it and pointed to
// the Transfer Request flow.
async function allocateAsset({ assetId, employeeId, departmentId, expectedReturnDate }) {
  const [existing] = await pool.query(
    `SELECT al.id, e.name AS holder_name
     FROM allocations al
     LEFT JOIN employees e ON al.employee_id = e.id
     WHERE al.asset_id = ? AND al.status = 'active'`,
    [assetId]
  );

  if (existing.length > 0) {
    const err = new Error(
      `This asset is currently held by ${existing[0].holder_name || 'another department'}. ` +
      `Use the Transfer Request option instead of a new allocation.`
    );
    err.status = 409;
    err.currentHolder = existing[0].holder_name;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO allocations (asset_id, employee_id, department_id, expected_return_date, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [assetId, employeeId || null, departmentId || null, expectedReturnDate || null]
  );

  await pool.query("UPDATE assets SET status = 'allocated' WHERE id = ?", [assetId]);

  return { id: result.insertId };
}

async function requestTransfer({ assetId, requestedBy }) {
  const [current] = await pool.query(
    "SELECT employee_id FROM allocations WHERE asset_id = ? AND status = 'active'",
    [assetId]
  );
  const currentHolderId = current.length > 0 ? current[0].employee_id : null;

  const [result] = await pool.query(
    `INSERT INTO transfer_requests (asset_id, requested_by, current_holder_id, status)
     VALUES (?, ?, ?, 'requested')`,
    [assetId, requestedBy, currentHolderId]
  );
  return { id: result.insertId };
}

async function approveTransfer(transferId, approvedBy) {
  const [rows] = await pool.query('SELECT * FROM transfer_requests WHERE id = ?', [transferId]);
  if (rows.length === 0) {
    const err = new Error('Transfer request not found.');
    err.status = 404;
    throw err;
  }
  const transfer = rows[0];

  // Close out the old allocation, open a new one for the requester.
  await pool.query(
    "UPDATE allocations SET status = 'returned', returned_at = NOW() WHERE asset_id = ? AND status = 'active'",
    [transfer.asset_id]
  );
  await pool.query(
    `INSERT INTO allocations (asset_id, employee_id, status) VALUES (?, ?, 'active')`,
    [transfer.asset_id, transfer.requested_by]
  );
  await pool.query(
    "UPDATE transfer_requests SET status = 'reallocated', approved_by = ? WHERE id = ?",
    [approvedBy, transferId]
  );
}

async function returnAsset(allocationId, { conditionNotes }) {
  const [rows] = await pool.query('SELECT * FROM allocations WHERE id = ?', [allocationId]);
  if (rows.length === 0) {
    const err = new Error('Allocation record not found.');
    err.status = 404;
    throw err;
  }
  await pool.query(
    `UPDATE allocations SET status = 'returned', returned_at = NOW(), return_condition_notes = ?
     WHERE id = ?`,
    [conditionNotes || null, allocationId]
  );
  await pool.query("UPDATE assets SET status = 'available' WHERE id = ?", [rows[0].asset_id]);
}

// Flags allocations past their expected return date as overdue.
// Call this on a schedule (or on dashboard load) — cheap to run.
async function flagOverdueAllocations() {
  await pool.query(
    `UPDATE allocations SET status = 'overdue'
     WHERE status = 'active' AND expected_return_date IS NOT NULL AND expected_return_date < CURDATE()`
  );
}

module.exports = {
  registerAsset,
  listAssets,
  getAssetHistory,
  allocateAsset,
  requestTransfer,
  approveTransfer,
  returnAsset,
  flagOverdueAllocations
};
