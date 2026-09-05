const pool = require('../config/db');

// Generates the next sequential asset tag, e.g. AF-0001, AF-0002...
async function generateAssetTag(dbOrConn = pool) {
  const [rows] = await dbOrConn.query(
    'SELECT asset_tag FROM assets ORDER BY id DESC LIMIT 1 FOR UPDATE'
  );
  if (rows.length === 0) {
    return 'AF-0001';
  }
  const lastTag = rows[0].asset_tag; // e.g. "AF-0037"
  const parts = (lastTag || '').split('-');
  const lastNumber = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  return `AF-${String(nextNumber).padStart(4, '0')}`;
}

module.exports = generateAssetTag;

