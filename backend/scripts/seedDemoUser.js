const path = require('path');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

(async function createDemo() {
  try {
    const email = 'demo@assetflow.test';
    const name = 'Demo User';
    const password = 'Demo1234!';

    const passwordHash = await bcrypt.hash(password, 10);

    const [existing] = await pool.query('SELECT id FROM employees WHERE email = ?', [email]);
    if (existing.length > 0) {
      await pool.query('UPDATE employees SET password_hash = ?, status = ? WHERE email = ?', [passwordHash, 'active', email]);
      console.log('Demo user updated.');
    } else {
      const [result] = await pool.query(
        `INSERT INTO employees (name, email, password_hash, department_id, role, status)
         VALUES (?, ?, ?, ?, 'employee', 'active')`,
        [name, email, passwordHash, null]
      );
      console.log('Demo user created.');
    }

    console.log('\nCredentials:');
    console.log('  Email: ' + email);
    console.log('  Password: ' + password);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create demo user:', err.message || err);
    process.exit(1);
  }
})();
