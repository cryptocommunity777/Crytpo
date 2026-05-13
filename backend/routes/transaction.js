const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// 🔹 Income Summary
 

// 🔹 User Transactions
router.get('/user/:userId', async (req, res) => {
  try {
    const txns = await Transaction.find({ userId: Number(req.params.userId) }).sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 All Transactions
router.get('/all', async (req, res) => {
  try {
    const txns = await Transaction.find().sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Filtered Transactions
router.get('/transactions/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { type } = req.query;

    // Always include all roles
    let filter = {
      $or: [
        { userId },
        { fromUserId: userId },
        { toUserId: userId },
      ],
    };

    // If a type is passed, apply it
    if (type) {
      filter.type = type;
    }

    const txns = await Transaction.find(filter).sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
