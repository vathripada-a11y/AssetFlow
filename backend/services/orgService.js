const pool = require('../config/db');

// ---- Departments ----
async function createDepartment({ name, headEmployeeId, parentDepartmentId }) {
  const [result] = await pool.query(
    `INSERT INTO departments (name, head_employee_id, parent_department_id, status)
     VALUES (?, ?, ?, 'active')`,
    [name, headEmployeeId || null, parentDepartmentId || null]
  );
  return { id: result.insertId, name };
}

async function listDepartments() {
  const [rows] = await pool.query(`
    SELECT d.*, e.name AS head_name
    FROM departments d
    LEFT JOIN employees e ON d.head_employee_id = e.id
    ORDER BY d.name
  `);
  return rows;
}

async function updateDepartment(id, { name, headEmployeeId, parentDepartmentId, status }) {
  await pool.query(
    `UPDATE departments SET name = ?, head_employee_id = ?, parent_department_id = ?, status = ?
     WHERE id = ?`,
    [name, headEmployeeId || null, parentDepartmentId || null, status, id]
  );
}

// ---- Asset Categories ----
async function createCategory({ name, customFields }) {
  const [result] = await pool.query(
    'INSERT INTO asset_categories (name, custom_fields) VALUES (?, ?)',
    [name, customFields ? JSON.stringify(customFields) : null]
  );
  return { id: result.insertId, name };
}

async function listCategories() {
  const [rows] = await pool.query('SELECT * FROM asset_categories ORDER BY name');
  return rows;
}

// ---- Employee Directory ----
async function listEmployees() {
  const [rows] = await pool.query(`
    SELECT e.id, e.name, e.email, e.role, e.status, d.name AS department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.name
  `);
  return rows;
}

// The ONLY place a role is elevated above 'employee'. Called by Admin only
// (enforced via requireRole(['admin']) at the route level).
async function promoteEmployee(employeeId, newRole) {
  const allowedRoles = ['employee', 'department_head', 'asset_manager', 'admin'];
  if (!allowedRoles.includes(newRole)) {
    const err = new Error(`Invalid role. Must be one of: ${allowedRoles.join(', ')}.`);
    err.status = 400;
    throw err;
  }
  await pool.query('UPDATE employees SET role = ? WHERE id = ?', [newRole, employeeId]);
}

async function updateEmployeeStatus(employeeId, status) {
  if (!['active', 'inactive'].includes(status)) {
    const err = new Error("Status must be 'active' or 'inactive'.");
    err.status = 400;
    throw err;
  }
  await pool.query('UPDATE employees SET status = ? WHERE id = ?', [status, employeeId]);
}

module.exports = {
  createDepartment,
  listDepartments,
  updateDepartment,
  createCategory,
  listCategories,
  listEmployees,
  promoteEmployee,
  updateEmployeeStatus
};
