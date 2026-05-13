const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const sendUSDT = require('../utils/sendUSDT'); // adjust path if needed

// ✅ Helper: Check if date is today
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// ✅ Total users
exports.getTotalUsers = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ totalUsers: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get total users' });
  }
};

 
// ✅ Get all withdrawals (flattened with schedules & ROI handling)
 
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find();

    const flattened = withdrawals.flatMap(w => {
      // --- 1️⃣ Scheduled withdrawals (wallet-based schedule) ---
      if (Array.isArray(w.schedule) && w.schedule.length > 0) {
        return w.schedule.map(d => {
          const gross = parseFloat(d.grossAmount ?? 0);
          const fee = parseFloat(d.fee ?? 0);
          const net = parseFloat((gross - fee).toFixed(2));

          return {
            _id: `${w._id}-${d.date}`,
            userId: w.userId ?? '-',
            name: w.name ?? '-',
            source: w.source ?? 'manual',
            grossAmount: parseFloat(gross.toFixed(2)),
            fee,
            netAmount: net,
            walletAddress: w.walletAddress ?? '-',
            txnHash: w.txnHash ?? '-',
            status: d.status ?? 'pending',
            day: d.day ?? '-',
            date: d.date ?? '-',
            createdAt: d.date ? new Date(d.date) : new Date()
          };
        });
      }

      // --- 2️⃣ Regular withdrawals without schedule ---
      const gross = parseFloat(w.grossAmount ?? 0);
      const fee = parseFloat(w.fee ?? 0);
      const net = parseFloat((gross - fee).toFixed(2));

      return [{
        _id: w._id,
        userId: w.userId ?? '-',
        name: w.name ?? '-',
        source: w.source ?? 'direct',
        grossAmount: gross,
        fee,
        netAmount: net,
        walletAddress: w.walletAddress ?? '-',
        txnHash: w.txnHash ?? '-',
        status: w.status ?? 'pending',
        day: '-', // no schedule
        date: w.createdAt ? w.createdAt.toISOString().split('T')[0] : '-',
        createdAt: w.createdAt ?? new Date()
      }];
    });

    // Sort by createdAt descending
    flattened.sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, withdrawals: flattened });

  } catch (err) {
    console.error("❌ Failed to fetch withdrawals:", err);
    res.status(500).json({ success: false, error: 'Failed to fetch withdrawals' });
  }
};










// ✅ Today's users
exports.getTodayUsers = async (req, res) => {
  try {
    const users = await User.find();
    const todayUsers = users.filter(user => isToday(user.createdAt));
    res.json({ todayUsers: todayUsers.length, ids: todayUsers.map(u => u.userId) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get today\'s users' });
  }
};

// ✅ Total deposit
exports.getTotalDeposit = async (req, res) => {
  try {
    const total = await Deposit.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    res.json({ totalDeposit: total[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get total deposit' });
  }
};

// ✅ Today's deposit
exports.getTodayDeposit = async (req, res) => {
  try {
    const deposits = await Deposit.find();
    const todayDeposits = deposits.filter(d => isToday(d.createdAt));
    const total = todayDeposits.reduce((sum, d) => sum + d.amount, 0);
    res.json({ todayDeposit: total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get today\'s deposit' });
  }
};

// ✅ Total withdrawal
exports.getTotalWithdrawal = async (req, res) => {
  try {
    const total = await Withdrawal.aggregate([{ $group: { _id: null, total: { $sum: "$netAmount" } } }]);
    res.json({ totalWithdrawal: total[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get total withdrawal' });
  }
};

// ✅ Today's withdrawal
exports.getTodayWithdrawal = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find();
    const todayWithdrawals = withdrawals.filter(w => isToday(w.createdAt));
    const total = todayWithdrawals.reduce((sum, w) => sum + w.netAmount, 0);
    res.json({ todayWithdrawal: total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get today\'s withdrawal' });
  }
};

// ✅ Pending withdrawals
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const pending = await Withdrawal.find({ status: 'pending' });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get pending withdrawals' });
  }
};

// ✅ Approve withdrawal
exports.approveWithdrawal = async (req, res) => {
  const { withdrawalId } = req.params;

  try {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    if (withdrawal.status === 'approved') {
      return res.status(400).json({ message: 'Already approved' });
    }

    const txHash = await sendUSDT(withdrawal.walletAddress, withdrawal.netAmount);

    withdrawal.status = 'approved';
    withdrawal.txHash = txHash;
    await withdrawal.save();

    res.json({ success: true, message: 'Withdrawal approved and USDT sent', txHash });
  } catch (err) {
    console.error("❌ Withdrawal approval failed:", err);
    res.status(500).json({ error: 'Withdrawal approval failed' });
  }
};

// ✅ Block user
exports.blockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block user' });
  }
};

// ✅ Unblock user
exports.unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

// ✅ Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// ✅ Update user by ID
exports.updateUserById = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// ✅ Admin dashboard stats
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const [totalUsers, users, depositAgg, withdrawalAgg] = await Promise.all([
      User.countDocuments(),
      User.find(),
      Deposit.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Withdrawal.aggregate([{ $group: { _id: null, total: { $sum: "$netAmount" } } }])
    ]);

    const todayUsers = users.filter(u => isToday(u.createdAt)).length;

    res.json({
      totalUsers,
      todayUsers,
      globalTeam: totalUsers,
      totalDeposit: depositAgg[0]?.total || 0,
      totalWithdrawal: withdrawalAgg[0]?.total || 0
    });
  } catch (err) {
    console.error("❌ Failed to load dashboard stats", err);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
};
