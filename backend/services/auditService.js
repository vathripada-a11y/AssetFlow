const pool = require('../config/db');
const { logActivity } = require('./notificationService');

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

  await logActivity(createdBy, `Created audit cycle #${cycleId}`);
  return { id: cycleId };
}

async function recordFinding({ auditCycleId, assetId, result, notes, recordedBy }) {
  const [cycleRows] = await pool.query('SELECT status FROM audit_cycles WHERE id = ?', [auditCycleId]);
  if (cycleRows.length === 0) {
    const err = new Error('Audit cycle not found.');
    err.status = 404;
    throw err;
  }
  if (cycleRows[0].status === 'closed') {
    const err = new Error('This audit cycle is closed and cannot accept new findings.');
    err.status = 400;
    throw err;
  }

  await pool.query(
    `INSERT INTO audit_findings (audit_cycle_id, asset_id, result, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?)`,
    [auditCycleId, assetId, result, notes || null, recordedBy]
  );

  await logActivity(recordedBy, `Recorded audit finding '${result}' for asset #${assetId} in cycle #${auditCycleId}`);
}

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

// Closing locks the cycle atomically and pushes confirmed-missing assets to 'lost'.
async function closeAuditCycle(auditCycleId, closedBy) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [cycleRows] = await connection.query(
      'SELECT * FROM audit_cycles WHERE id = ? FOR UPDATE',
      [auditCycleId]
    );

    if (cycleRows.length === 0) {
      const err = new Error('Audit cycle not found.');
      err.status = 404;
      throw err;
    }

    if (cycleRows[0].status === 'closed') {
      const err = new Error('This audit cycle is already closed.');
      err.status = 409;
      throw err;
    }

    const [missingAssets] = await connection.query(
      "SELECT DISTINCT asset_id FROM audit_findings WHERE audit_cycle_id = ? AND result = 'missing'",
      [auditCycleId]
    );

    for (const row of missingAssets) {
      await connection.query(
        "UPDATE assets SET status = 'lost' WHERE id = ?",
        [row.asset_id]
      );
    }

    await connection.query(
      "UPDATE audit_cycles SET status = 'closed' WHERE id = ?",
      [auditCycleId]
    );

    if (closedBy) {
      await logActivity(closedBy, `Closed audit cycle #${auditCycleId} (${missingAssets.length} assets marked lost)`, connection);
    }

    await connection.commit();

  } catch (err) {
    await connection.rollback();
    throw err;

  } finally {
    connection.release();
  }
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
