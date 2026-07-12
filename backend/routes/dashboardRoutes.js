const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticate = require('../middleware/auth');
const assetService = require('../services/assetService');

router.use(authenticate);

router.get('/kpis', async (req, res) => {
  try {
    // Keep overdue flags fresh whenever the dashboard loads.
    await assetService.flagOverdueAllocations();

    const [[{ available }]] = await pool.query(
      "SELECT COUNT(*) AS available FROM assets WHERE status = 'available'"
    );
    const [[{ allocated }]] = await pool.query(
      "SELECT COUNT(*) AS allocated FROM assets WHERE status = 'allocated'"
    );
    const [[{ maintenanceToday }]] = await pool.query(
      "SELECT COUNT(*) AS maintenanceToday FROM maintenance_requests WHERE status IN ('approved','technician_assigned','in_progress') AND DATE(created_at) = CURDATE()"
    );
    const [[{ activeBookings }]] = await pool.query(
      "SELECT COUNT(*) AS activeBookings FROM bookings WHERE status IN ('upcoming','ongoing')"
    );
    const [[{ pendingTransfers }]] = await pool.query(
      "SELECT COUNT(*) AS pendingTransfers FROM transfer_requests WHERE status = 'requested'"
    );
    const [[{ overdueReturns }]] = await pool.query(
      "SELECT COUNT(*) AS overdueReturns FROM allocations WHERE status = 'overdue'"
    );

    res.json({ available, allocated, maintenanceToday, activeBookings, pendingTransfers, overdueReturns });
  } catch (err) {
    res.status(500).json({ error: 'Could not load dashboard KPIs.' });
  }
});

module.exports = router;
