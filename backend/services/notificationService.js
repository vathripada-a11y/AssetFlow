const pool = require('../config/db');

async function notify(employeeId, type, message, dbOrConn = pool) {
  if (!employeeId) return;
  await dbOrConn.query(
    'INSERT INTO notifications (employee_id, type, message) VALUES (?, ?, ?)',
    [employeeId, type, message]
  );
}

async function listForEmployee(employeeId) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE employee_id = ? ORDER BY created_at DESC LIMIT 50',
    [employeeId]
  );
  return rows;
}

async function markRead(notificationId, employeeId) {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND employee_id = ?', [notificationId, employeeId]);
}

async function logActivity(employeeId, action, dbOrConn = pool) {
  if (!employeeId) return;
  await dbOrConn.query('INSERT INTO activity_logs (employee_id, action) VALUES (?, ?)', [employeeId, action]);
}

async function listActivityLogs(limit = 100) {
  const [rows] = await pool.query(`
    SELECT al.*, e.name AS employee_name, e.email AS employee_email
    FROM activity_logs al
    LEFT JOIN employees e ON al.employee_id = e.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `, [parseInt(limit, 10) || 100]);
  return rows;
}

module.exports = { notify, listForEmployee, markRead, logActivity, listActivityLogs };
