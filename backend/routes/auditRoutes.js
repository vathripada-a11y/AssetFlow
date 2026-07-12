const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    res.json(await auditService.listAuditCycles());
  } catch (err) {
    res.status(500).json({ error: 'Could not load audit cycles.' });
  }
});

router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const cycle = await auditService.createAuditCycle({ ...req.body, createdBy: req.user.id });
    res.status(201).json(cycle);
  } catch (err) {
    res.status(500).json({ error: 'Could not create audit cycle.' });
  }
});

router.post('/:id/findings', async (req, res) => {
  try {
    await auditService.recordFinding({
      auditCycleId: req.params.id,
      assetId: req.body.assetId,
      result: req.body.result,
      notes: req.body.notes,
      recordedBy: req.user.id
    });
    res.status(201).json({ message: 'Finding recorded.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not record finding.' });
  }
});

router.get('/:id/discrepancy-report', async (req, res) => {
  try {
    res.json(await auditService.getDiscrepancyReport(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Could not load discrepancy report.' });
  }
});

router.put('/:id/close', requireRole(['admin']), async (req, res) => {
  try {
    await auditService.closeAuditCycle(req.params.id);
    res.json({ message: 'Audit cycle closed.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not close audit cycle.' });
  }
});

module.exports = router;
