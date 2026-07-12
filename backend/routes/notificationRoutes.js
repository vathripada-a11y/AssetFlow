const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    res.json(await notificationService.listForEmployee(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Could not load notifications.' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await notificationService.markRead(req.params.id);
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update notification.' });
  }
});

module.exports = router;
