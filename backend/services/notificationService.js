const pool = require('../config/db');

async function notify(employeeId, type, message) {
  await pool.query(
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

async function markRead(notificationId) {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [notificationId]);
}

async function logActivity(employeeId, action) {
  await pool.query('INSERT INTO activity_logs (employee_id, action) VALUES (?, ?)', [employeeId, action]);
}

module.exports = { notify, listForEmployee, markRead, logActivity };
