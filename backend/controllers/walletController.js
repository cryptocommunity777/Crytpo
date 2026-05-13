const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal'); // ✅ Also needed

// ✅ Deposit Controller
exports.depositAmount = async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount)
    return res.status(400).json({ message: 'User ID and amount are required' });

  try {
    const user = await User.findOne({ userId: Number(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.walletBalance += Number(amount);
    await user.save();

    const deposit = new Deposit({
      userId,
      amount,
      status: 'approved',
      createdAt: new Date()
    });

    await deposit.save(); // ✅ Save the deposit

    console.log(`Deposit successful for UserID ${userId}: $${amount}`);
    res.status(200).json({ message: 'Deposit successful', deposit, newBalance: user.walletBalance });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: 'Deposit failed' });
  }
};

// ✅ Top-Up Controller
exports.topUpWallet = async (req, res) => {
  // Add top-up logic here if needed
  res.json({ message: "Top-up endpoint placeholder" });
};

// ✅ Wallet History Controller
exports.getWalletHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const withdrawals = await Withdrawal.find({ userId: Number(userId) }).sort({ date: -1 });
    res.json({ withdrawals });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};
