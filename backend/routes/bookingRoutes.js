const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/asset/:assetId', async (req, res) => {
  try {
    res.json(await bookingService.listBookingsForAsset(req.params.assetId));
  } catch (err) {
    res.status(500).json({ error: 'Could not load bookings.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await bookingService.createBooking({
      assetId: req.body.assetId,
      bookedBy: req.user.id,
      startTime: req.body.startTime,
      endTime: req.body.endTime
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not create booking.' });
  }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    await bookingService.cancelBooking(req.params.id, req.user.id);
    res.json({ message: 'Booking cancelled.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel booking.' });
  }
});

module.exports = router;
