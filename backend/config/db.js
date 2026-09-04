const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'assetflow';

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  multipleStatements: true
});

async function initializeDatabase() {
  const adminConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true
  });

  await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await adminConnection.end();

  try {
    await pool.query('SELECT 1 FROM employees LIMIT 1');
    console.log('Database already initialized.');
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') {
      throw err;
    }

    console.log('Initializing database schema...');
    const schemaPath = path.resolve(__dirname, '../migrations/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('Database schema initialized.');
  }
}

pool.initializeDatabase = initializeDatabase;
module.exports = pool;
