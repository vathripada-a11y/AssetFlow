const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((acc, line) => {
      const [key, ...rest] = line.split('=');
      if (!key) return acc;
      acc[key.trim()] = rest.join('=').trim();
      return acc;
    }, {});
}

(async () => {
  try {
    const env = loadEnv();
    const pool = mysql.createPool({
      host: env.DB_HOST || 'localhost',
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      database: env.DB_NAME || 'assetflow',
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true
    });

    const [dbs] = await pool.query("SHOW DATABASES LIKE 'assetflow'");
    console.log('DB_EXISTS', dbs.length);
    const [tabs] = await pool.query("SHOW TABLES LIKE 'employees'");
    console.log('EMPLOYEES_TABLE_EXISTS', tabs.length);
    if (tabs.length === 1) {
      const [cols] = await pool.query('DESCRIBE employees');
      console.log('EMPLOYEES_COLUMNS', JSON.stringify(cols.map(c => ({ Field: c.Field, Type: c.Type })), null, 2));
    }

    await pool.end();
  } catch (err) {
    console.error('DB_ERROR', err.message);
    if (err.sqlMessage) console.error('SQLMSG', err.sqlMessage);
    process.exit(1);
  }
})();
