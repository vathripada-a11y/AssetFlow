// Checks whether a proposed booking (startTime, endTime) for a given asset
// overlaps with any existing 'upcoming' or 'ongoing' booking for that asset.
// Two ranges overlap unless one ends at/before the other starts.
async function hasOverlap(pool, assetId, startTime, endTime, excludeBookingId = null) {
  let query = `
    SELECT id FROM bookings
    WHERE asset_id = ?
      AND status IN ('upcoming', 'ongoing')
      AND NOT (end_time <= ? OR start_time >= ?)
  `;
  const params = [assetId, startTime, endTime];

  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }

  const [rows] = await pool.query(query, params);
  return rows.length > 0;
}

module.exports = hasOverlap;
