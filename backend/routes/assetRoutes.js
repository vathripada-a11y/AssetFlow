const express = require('express');
const router = express.Router();
const assetService = require('../services/assetService');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { status, categoryId, search } = req.query;
    res.json(await assetService.listAssets({ status, categoryId, search }));
  } catch (err) {
    res.status(500).json({ error: 'Could not load assets.' });
  }
});

router.post('/', requireRole(['asset_manager']), async (req, res) => {
  try {
    const asset = await assetService.registerAsset(req.body);
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: 'Could not register asset.' });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    res.json(await assetService.getAssetHistory(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Could not load asset history.' });
  }
});

// Allocation — blocked automatically if already allocated (see service layer)
router.post('/:id/allocate', requireRole(['asset_manager', 'department_head']), async (req, res) => {
  try {
    const result = await assetService.allocateAsset({
      assetId: req.params.id,
      employeeId: req.body.employeeId,
      departmentId: req.body.departmentId,
      expectedReturnDate: req.body.expectedReturnDate
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Could not allocate asset.',
      currentHolder: err.currentHolder || undefined
    });
  }
});

router.post('/:id/transfer-request', async (req, res) => {
  try {
    const result = await assetService.requestTransfer({
      assetId: req.params.id,
      requestedBy: req.user.id
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Could not submit transfer request.' });
  }
});

router.put('/transfer-requests/:id/approve', requireRole(['asset_manager', 'department_head']), async (req, res) => {
  try {
    await assetService.approveTransfer(req.params.id, req.user.id);
    res.json({ message: 'Transfer approved and asset reallocated.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not approve transfer.' });
  }
});

router.put('/allocations/:id/return', requireRole(['asset_manager', 'department_head']), async (req, res) => {
  try {
    await assetService.returnAsset(req.params.id, { conditionNotes: req.body.conditionNotes });
    res.json({ message: 'Asset marked as returned.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not process return.' });
  }
});

module.exports = router;
