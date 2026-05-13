const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const adminAuth = require('../middleware/adminAuth');

// CREATE
router.post('/create', adminAuth, async (req, res) => {
  const { title, message, type, target } = req.body;
  const notification = await Notification.create({
    title,
    message,
    type,
    target,
  });
  res.json(notification);
});

// LIST (admin)
router.get('/list', adminAuth, async (req, res) => {
  const list = await Notification.find().sort({ createdAt: -1 });
  res.json(list);
});


// 🔔 USER - unread notification count
// GET /api/notifications/count/:userId
router.get('/count/:userId', async (req, res) => {
  const { userId } = req.params;
  const count = await Notification.countDocuments({ readBy: { $ne: userId } });
  res.json({ count });
});


// POST /api/notifications/mark-read/:userId
router.post('/mark-read/:userId', async (req, res) => {
  const { userId } = req.params;
  await Notification.updateMany(
    { readBy: { $ne: userId } },
    { $push: { readBy: userId } }
  );
  res.json({ success: true });
});


// DELETE
router.delete('/:id', adminAuth, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


// 👤 USER - get notifications (PUBLIC)
router.get('/user', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
