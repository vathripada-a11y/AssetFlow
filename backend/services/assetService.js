const pool = require('../config/db');
const generateAssetTag = require('../utils/assetTagGenerator');

// ---- Asset Registration & Directory ----
async function registerAsset(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const assetTag = await generateAssetTag(connection);
    const [result] = await connection.query(
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

    await connection.commit();
    return { id: result.insertId, assetTag };

  } catch (err) {
    await connection.rollback();
    throw err;

  } finally {
    connection.release();
  }
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
async function allocateAsset({
  assetId,
  employeeId,
  departmentId,
  expectedReturnDate
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the asset row so concurrent allocation requests
    // cannot modify the same asset simultaneously.
    const [assetRows] = await connection.query(
      `SELECT id, status
       FROM assets
       WHERE id = ?
       FOR UPDATE`,
      [assetId]
    );

    if (assetRows.length === 0) {
      const err = new Error('Asset not found.');
      err.status = 404;
      throw err;
    }

    const [existing] = await connection.query(
      `SELECT al.id, e.name AS holder_name
       FROM allocations al
       LEFT JOIN employees e ON al.employee_id = e.id
       WHERE al.asset_id = ? AND al.status = 'active'`,
      [assetId]
    );

    if (existing.length > 0) {
      const err = new Error(
        `This asset is currently held by ${
          existing[0].holder_name || 'another department'
        }. Use the Transfer Request option instead of a new allocation.`
      );

      err.status = 409;
      err.currentHolder = existing[0].holder_name;
      throw err;
    }

    if (requestingUser && requestingUser.role === 'department_head') {
      if (employeeId) {
        const [empRows] = await connection.query(
          'SELECT department_id FROM employees WHERE id = ?',
          [employeeId]
        );
        if (empRows.length > 0 && empRows[0].department_id !== requestingUser.department_id) {
          const err = new Error('Department Heads can only allocate assets to employees within their own department.');
          err.status = 403;
          throw err;
        }
      }
      if (departmentId && parseInt(departmentId, 10) !== parseInt(requestingUser.department_id, 10)) {
        const err = new Error('Department Heads can only allocate assets to their own department.');
        err.status = 403;
        throw err;
      }
    }

    const [result] = await connection.query(
      `INSERT INTO allocations
       (asset_id, employee_id, department_id, expected_return_date, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [
        assetId,
        employeeId || null,
        departmentId || null,
        expectedReturnDate || null
      ]
    );

    await connection.query(
      `UPDATE assets
       SET status = 'allocated'
       WHERE id = ?`,
      [assetId]
    );
    

    await connection.commit();

    return { id: result.insertId };

  } catch (err) {
    await connection.rollback();
    throw err;

  } finally {
    connection.release();
  }
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
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the transfer request so it cannot be approved concurrently.
    const [rows] = await connection.query(
      `SELECT *
       FROM transfer_requests
       WHERE id = ?
       FOR UPDATE`,
      [transferId]
    );

    if (rows.length === 0) {
      const err = new Error('Transfer request not found.');
      err.status = 404;
      throw err;
    }

    const transfer = rows[0];

    // Prevent an already processed request from being approved again.
    if (transfer.status !== 'requested') {
      const err = new Error(
        `Transfer request cannot be approved because its current status is '${transfer.status}'.`
      );
      err.status = 409;
      throw err;
    }

    if (requestingUser && requestingUser.role === 'department_head') {
      const [reqEmp] = await connection.query(
        'SELECT department_id FROM employees WHERE id = ?',
        [transfer.requested_by]
      );
      const isRequesterInDept = reqEmp.length > 0 && reqEmp[0].department_id === requestingUser.department_id;

      let isCurrentHolderInDept = false;
      if (transfer.current_holder_id) {
        const [curEmp] = await connection.query(
          'SELECT department_id FROM employees WHERE id = ?',
          [transfer.current_holder_id]
        );
        isCurrentHolderInDept = curEmp.length > 0 && curEmp[0].department_id === requestingUser.department_id;
      }

      if (!isRequesterInDept && !isCurrentHolderInDept) {
        const err = new Error('Department Heads can only approve transfer requests involving their own department.');
        err.status = 403;
        throw err;
      }
    }

    // Lock the asset so another allocation/transfer cannot
    // modify the same asset at the same time.
    const [assetRows] = await connection.query(
      `SELECT id, status
       FROM assets
       WHERE id = ?
       FOR UPDATE`,
      [transfer.asset_id]
    );

    if (assetRows.length === 0) {
      const err = new Error('Asset not found.');
      err.status = 404;
      throw err;
    }

    // Lock the current allocation before replacing it.
    await connection.query(
      `SELECT id
       FROM allocations
       WHERE asset_id = ? AND status = 'active'
       FOR UPDATE`,
      [transfer.asset_id]
    );

    // Close the old allocation.
    await connection.query(
      `UPDATE allocations
       SET status = 'returned',
           returned_at = NOW()
       WHERE asset_id = ? AND status = 'active'`,
      [transfer.asset_id]
    );

    // Create the new allocation for the requester.
    await connection.query(
      `INSERT INTO allocations
       (asset_id, employee_id, status)
       VALUES (?, ?, 'active')`,
      [transfer.asset_id, transfer.requested_by]
    );

    // Mark the transfer request as completed.
    await connection.query(
      `UPDATE transfer_requests
       SET status = 'reallocated',
           approved_by = ?
       WHERE id = ?`,
      [approvedBy, transferId]
    );

    await connection.commit();

  } catch (err) {
    await connection.rollback();
    throw err;

  } finally {
    connection.release();
  }
}

async function returnAsset(allocationId, { conditionNotes }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the allocation so concurrent return requests
    // cannot process the same allocation simultaneously.
    const [rows] = await connection.query(
      `SELECT *
       FROM allocations
       WHERE id = ?
       FOR UPDATE`,
      [allocationId]
    );

    if (rows.length === 0) {
      const err = new Error('Allocation record not found.');
      err.status = 404;
      throw err;
    }

    const allocation = rows[0];

    // Only active or overdue allocations can be returned.
    if (
      allocation.status !== 'active' &&
      allocation.status !== 'overdue'
    ) {
      const err = new Error(
        `Allocation cannot be returned because its current status is '${allocation.status}'.`
      );
      err.status = 409;
      throw err;
    }

    if (requestingUser && requestingUser.role === 'department_head') {
      let isDeptMatch = allocation.department_id === requestingUser.department_id;
      if (!isDeptMatch && allocation.employee_id) {
        const [empRows] = await connection.query(
          'SELECT department_id FROM employees WHERE id = ?',
          [allocation.employee_id]
        );
        isDeptMatch = empRows.length > 0 && empRows[0].department_id === requestingUser.department_id;
      }
      if (!isDeptMatch) {
        const err = new Error('Department Heads can only return assets allocated to their own department.');
        err.status = 403;
        throw err;
      }
    }

    // Lock the asset before changing its status.
    const [assetRows] = await connection.query(
      `SELECT id
       FROM assets
       WHERE id = ?
       FOR UPDATE`,
      [allocation.asset_id]
    );

    if (assetRows.length === 0) {
      const err = new Error('Asset not found.');
      err.status = 404;
      throw err;
    }

    // Close the allocation.
    await connection.query(
      `UPDATE allocations
       SET status = 'returned',
           returned_at = NOW(),
           return_condition_notes = ?
       WHERE id = ?`,
      [conditionNotes || null, allocationId]
    );

    // Make the asset available again.
    await connection.query(
      `UPDATE assets
       SET status = 'available'
       WHERE id = ?`,
      [allocation.asset_id]
    );

    await connection.commit();

  } catch (err) {
    await connection.rollback();
    throw err;

  } finally {
    connection.release();
  }
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
