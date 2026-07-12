const express = require('express');
const router = express.Router();
const maintenanceService = require('../services/maintenanceService');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    res.json(await maintenanceService.listRequests({ status: req.query.status }));
  } catch (err) {
    res.status(500).json({ error: 'Could not load maintenance requests.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await maintenanceService.raiseRequest({
      assetId: req.body.assetId,
      raisedBy: req.user.id,
      issueDescription: req.body.issueDescription,
      priority: req.body.priority,
      photoUrl: req.body.photoUrl
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Could not raise maintenance request.' });
  }
});

router.put('/:id/approve', requireRole(['asset_manager']), async (req, res) => {
  try {
    await maintenanceService.approveRequest(req.params.id, req.user.id);
    res.json({ message: 'Request approved. Asset marked Under Maintenance.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not approve request.' });
  }
});

router.put('/:id/reject', requireRole(['asset_manager']), async (req, res) => {
  try {
    await maintenanceService.rejectRequest(req.params.id, req.user.id);
    res.json({ message: 'Request rejected.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not reject request.' });
  }
});

router.put('/:id/assign-technician', requireRole(['asset_manager']), async (req, res) => {
  try {
    await maintenanceService.assignTechnician(req.params.id, req.body.technicianName);
    res.json({ message: 'Technician assigned.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not assign technician.' });
  }
});

router.put('/:id/in-progress', requireRole(['asset_manager']), async (req, res) => {
  try {
    await maintenanceService.markInProgress(req.params.id);
    res.json({ message: 'Marked as in progress.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update status.' });
  }
});

router.put('/:id/resolve', requireRole(['asset_manager']), async (req, res) => {
  try {
    await maintenanceService.resolveRequest(req.params.id);
    res.json({ message: 'Request resolved. Asset marked Available.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not resolve request.' });
  }
});

module.exports = router;
