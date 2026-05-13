const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 🌳 Recursive function to get full downline tree
async function getDownline(userId) {
  const children = await User.find({ sponsorId: userId }).select('userId name sponsorId');
  const childrenWithSub = await Promise.all(children.map(async (child) => {
    const subtree = await getDownline(child.userId);
    return {
      userId: child.userId,
      name: child.name,
      children: subtree
    };
  }));
  return childrenWithSub;
}

// 🌳 GET Full Referral Tree
router.get('/tree/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });

    const user = await User.findOne({ userId }).select('userId name');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const downline = await getDownline(userId);
    res.json({
      userId: user.userId,
      name: user.name,
      children: downline,
    });
  } catch (err) {
    console.error('Tree fetch error:', err);
    res.status(500).json({ message: 'Tree fetch error' });
  }
});

// 👥 Direct Team (1st level)
router.get('/direct/:userId', async (req, res) => {
  try {
    const direct = await User.find({ sponsorId: Number(req.params.userId) });
    res.json(direct);
  } catch (err) {
    res.status(500).json({ message: 'Direct fetch error' });
  }
});

// 👥 All Team (all levels)
async function getAllDownline(userId, depth = 1, result = []) {
  const referrals = await User.find({ sponsorId: Number(userId) });
  for (const user of referrals) {
    result.push({ ...user._doc, level: depth });
    await getAllDownline(user.userId, depth + 1, result);
  }
  return result;
}

router.get('/all/:userId', async (req, res) => {
  try {
    const allTeam = await getAllDownline(req.params.userId);
    res.json({ team: allTeam });
  } catch (err) {
    res.status(500).json({ message: 'All team fetch error' });
  }
});

module.exports = router;
