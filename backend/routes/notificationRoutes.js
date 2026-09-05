const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const authenticate = require('../middleware/auth');

const requireRole = require('../middleware/rbac');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    res.json(await notificationService.listForEmployee(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Could not load notifications.' });
  }
});

router.get('/activity', requireRole(['admin', 'asset_manager', 'department_head']), async (req, res) => {
  try {
    res.json(await notificationService.listActivityLogs(req.query.limit || 100));
  } catch (err) {
    res.status(500).json({ error: 'Could not load activity logs.' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await notificationService.markRead(req.params.id, req.user.id);
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update notification.' });
  }
});

module.exports = router;
