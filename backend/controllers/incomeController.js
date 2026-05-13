const User = require('../models/User');

// Helper function to calculate autopool income
const calculateAutopoolIncome = (levelStatus = {}) => {
  const planBaseAmount = { 30: 1, 60: 2, 120: 4, 240: 8 };
  let total = 0;

  for (const [plan, levels] of Object.entries(levelStatus)) {
    const base = planBaseAmount[plan];
    if (!base) continue;

    levels.forEach((levelObj) => {
      if (levelObj.status === "achieved") {
        total += base * Math.pow(2, levelObj.level - 1);
      }
    });
  }

  return total;
};

// Route handler for income summary
const getIncomeSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const directIncome = user.directIncome || 0;
    const levelIncome = user.levelIncome || 0;
    const autopoolIncome = calculateAutopoolIncome(user.levelStatus);

    res.json({
      directIncome,
      levelIncome,
      autopoolIncome,
      totalIncome: directIncome + levelIncome + autopoolIncome,
    });
  } catch (error) {
    console.error('Error getting income summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getIncomeSummary,
};
