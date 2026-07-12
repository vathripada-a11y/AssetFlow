// Generates the next sequential asset tag, e.g. AF-0001, AF-0002...
async function generateAssetTag(pool) {
  const [rows] = await pool.query(
    'SELECT asset_tag FROM assets ORDER BY id DESC LIMIT 1'
  );
  if (rows.length === 0) {
    return 'AF-0001';
  }
  const lastTag = rows[0].asset_tag; // e.g. "AF-0037"
  const lastNumber = parseInt(lastTag.split('-')[1], 10);
  const nextNumber = lastNumber + 1;
  return `AF-${String(nextNumber).padStart(4, '0')}`;
}

module.exports = generateAssetTag;
