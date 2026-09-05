const pool = require('../config/db');
const hasOverlap = require('../utils/overlapChecker');
const { validateBookingTimes } = require('../utils/validators');
const { logActivity } = require('./notificationService');

async function createBooking({ assetId, bookedBy, startTime, endTime }) {
  const timeError = validateBookingTimes(startTime, endTime);
  if (timeError) {
    const err = new Error(timeError);
    err.status = 400;
    throw err;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the parent asset row to force concurrent booking requests for this asset to serialize
    const [assetRows] = await connection.query(
      'SELECT id, is_bookable, status FROM assets WHERE id = ? FOR UPDATE',
      [assetId]
    );

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

    if (['under_maintenance', 'lost', 'retired', 'disposed'].includes(assetRows[0].status)) {
      const err = new Error(`Asset cannot be booked because its current status is '${assetRows[0].status}'.`);
      err.status = 409;
      throw err;
    }

    const overlapping = await hasOverlap(connection, assetId, startTime, endTime);
    if (overlapping) {
      const err = new Error('This time slot overlaps with an existing booking for this resource.');
      err.status = 409;
      throw err;
    }

    const [result] = await connection.query(
      `INSERT INTO bookings (asset_id, booked_by, start_time, end_time, status)
       VALUES (?, ?, ?, ?, 'upcoming')`,
      [assetId, bookedBy, startTime, endTime]
    );

    await logActivity(bookedBy, `Booked resource asset #${assetId} (${startTime} to ${endTime})`, connection);

    await connection.commit();
    return { id: result.insertId };

  } catch (err) {
    await connection.rollback();
    throw err;

  } finally {
    connection.release();
  }
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

async function cancelBooking(bookingId, requester) {
  const isManagerOrAdmin =
    typeof requester === 'object' &&
    (requester.role === 'admin' || requester.role === 'asset_manager');

  const requesterId = typeof requester === 'object' ? requester.id : requester;

  if (isManagerOrAdmin) {
    await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
      [bookingId]
    );
  } else {
    await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND booked_by = ?",
      [bookingId, requesterId]
    );
  }

  await logActivity(requesterId, `Cancelled booking #${bookingId}`);
}

module.exports = { createBooking, listBookingsForAsset, cancelBooking };
