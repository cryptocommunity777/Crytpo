const User = require('../models/User');
 const sanitizeUser = require('../utils/sanitizeUser'); // 👈 make sure this exists

// 🔍 Get user by ID
 


// 🔒 Block user
exports.blockUser = async (req, res) => {
  const user = await User.findOneAndUpdate(
    { userId: req.params.id },
    { isBlocked: true },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User blocked successfully' });
};

// 🔓 Unblock user
exports.unblockUser = async (req, res) => {
  const user = await User.findOneAndUpdate(
    { userId: req.params.id },
    { isBlocked: false },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User unblocked successfully' });
};

// 📋 Get all users
exports.getAllUsers = async (req, res) => {
  const users = await User.find().sort({ userId: 1 });
  res.json(users);
};
