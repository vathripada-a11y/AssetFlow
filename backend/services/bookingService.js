const pool = require('../config/db');
const hasOverlap = require('../utils/overlapChecker');
const { validateBookingTimes } = require('../utils/validators');

async function createBooking({ assetId, bookedBy, startTime, endTime }) {
  const timeError = validateBookingTimes(startTime, endTime);
  if (timeError) {
    const err = new Error(timeError);
    err.status = 400;
    throw err;
  }

  const [assetRows] = await pool.query('SELECT is_bookable FROM assets WHERE id = ?', [assetId]);
  if (assetRows.length === 0) {
    const err = new Error('Asset not found.');
    err.status = 404;
    throw err;
  }
  if (!assetRows[0].is_bookable) {
    const err = new Error('This asset is not marked as a shared/bookable resource.');
    err.status = 400;
    throw err;
  }

  const overlapping = await hasOverlap(pool, assetId, startTime, endTime);
  if (overlapping) {
    const err = new Error('This time slot overlaps with an existing booking for this resource.');
    err.status = 409;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO bookings (asset_id, booked_by, start_time, end_time, status)
     VALUES (?, ?, ?, ?, 'upcoming')`,
    [assetId, bookedBy, startTime, endTime]
  );
  return { id: result.insertId };
}

async function listBookingsForAsset(assetId) {
  const [rows] = await pool.query(
    `SELECT b.*, e.name AS booked_by_name
     FROM bookings b
     LEFT JOIN employees e ON b.booked_by = e.id
     WHERE b.asset_id = ? ORDER BY b.start_time`,
    [assetId]
  );
  return rows;
}

async function cancelBooking(bookingId, requesterId) {
  await pool.query(
    "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND booked_by = ?",
    [bookingId, requesterId]
  );
}

module.exports = { createBooking, listBookingsForAsset, cancelBooking };
