const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// Signup ALWAYS creates an 'employee' role account.
// Role elevation only ever happens via the Org Setup (admin) service — never here.
async function signup({ name, email, password, departmentId }) {
  const [existing] = await pool.query('SELECT id FROM employees WHERE email = ?', [email]);
  if (existing.length > 0) {
    const err = new Error('An account with this email already exists.');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    `INSERT INTO employees (name, email, password_hash, department_id, role, status)
     VALUES (?, ?, ?, ?, 'employee', 'active')`,
    [name, email, passwordHash, departmentId || null]
  );

  return { id: result.insertId, name, email, role: 'employee' };
}

async function login({ email, password }) {
  const [rows] = await pool.query('SELECT * FROM employees WHERE email = ?', [email]);
  if (rows.length === 0) {
    const err = new Error('No account found with this email.');
    err.status = 401;
    throw err;
  }

  const employee = rows[0];

  if (employee.status !== 'active') {
    const err = new Error('This account has been deactivated. Contact your Admin.');
    err.status = 403;
    throw err;
  }

  const passwordMatches = await bcrypt.compare(password, employee.password_hash);
  if (!passwordMatches) {
    const err = new Error('Incorrect password.');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department_id: employee.department_id
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department_id: employee.department_id
    }
  };
}

module.exports = { signup, login };
