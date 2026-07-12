const pool = require('../config/db');

async function createAuditCycle({ scopeDepartmentId, scopeLocation, startDate, endDate, createdBy, auditorIds }) {
  const [result] = await pool.query(
    `INSERT INTO audit_cycles (scope_department_id, scope_location, start_date, end_date, status, created_by)
     VALUES (?, ?, ?, ?, 'open', ?)`,
    [scopeDepartmentId || null, scopeLocation || null, startDate, endDate, createdBy]
  );
  const cycleId = result.insertId;

  if (Array.isArray(auditorIds)) {
    for (const employeeId of auditorIds) {
      await pool.query(
        'INSERT INTO audit_cycle_auditors (audit_cycle_id, employee_id) VALUES (?, ?)',
        [cycleId, employeeId]
      );
    }
  }
  return { id: cycleId };
}

async function recordFinding({ auditCycleId, assetId, result, notes, recordedBy }) {
  const [cycleRows] = await pool.query('SELECT status FROM audit_cycles WHERE id = ?', [auditCycleId]);
  if (cycleRows.length === 0 || cycleRows[0].status === 'closed') {
    const err = new Error('This audit cycle is closed and cannot accept new findings.');
    err.status = 400;
    throw err;
  }

  await pool.query(
    `INSERT INTO audit_findings (audit_cycle_id, asset_id, result, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?)`,
    [auditCycleId, assetId, result, notes || null, recordedBy]
  );
}

// The discrepancy report is simply the set of non-'verified' findings for the cycle.
async function getDiscrepancyReport(auditCycleId) {
  const [rows] = await pool.query(
    `SELECT af.*, a.asset_tag, a.name AS asset_name
     FROM audit_findings af
     JOIN assets a ON af.asset_id = a.id
     WHERE af.audit_cycle_id = ? AND af.result != 'verified'
     ORDER BY af.created_at DESC`,
    [auditCycleId]
  );
  return rows;
}

// Closing locks the cycle and pushes confirmed-missing assets to 'lost'.
async function closeAuditCycle(auditCycleId) {
  const [missingAssets] = await pool.query(
    "SELECT DISTINCT asset_id FROM audit_findings WHERE audit_cycle_id = ? AND result = 'missing'",
    [auditCycleId]
  );

  for (const row of missingAssets) {
    await pool.query("UPDATE assets SET status = 'lost' WHERE id = ?", [row.asset_id]);
  }

  await pool.query("UPDATE audit_cycles SET status = 'closed' WHERE id = ?", [auditCycleId]);
}

async function listAuditCycles() {
  const [rows] = await pool.query(
    `SELECT ac.*, d.name AS department_name
     FROM audit_cycles ac
     LEFT JOIN departments d ON ac.scope_department_id = d.id
     ORDER BY ac.start_date DESC`
  );
  return rows;
}

module.exports = {
  createAuditCycle,
  recordFinding,
  getDiscrepancyReport,
  closeAuditCycle,
  listAuditCycles
};
