const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET all top-up packages
router.get('/', async (req, res) => {
  try {
    // Fetch all users who have topped up
    const users = await User.find({ topUpAmount: { $gt: 0 } });

    // Map users to package-like structure
    const packages = users.map(u => ({
      _id: `topup-${u.userId}`,
      name: `Top-up $${u.topUpAmount}`,
      price: u.topUpAmount,
      minWithdraw: 20,
      maxWithdraw: Math.max(100, u.topUpAmount * 10),
      userId: u.userId
    }));

    res.json({ packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
