const User = require('../models/User');
const sanitizeUser = require('../utils/sanitizeUser');

// 🔍 1. Get User Dashboard Data (Real Count Logic Added)
exports.getUserDashboard = async (req, res) => {
  try {
    // req.user.id se logged-in user dhundo (auth middleware se aayega)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🔥 Total Real Users ka count nikalna
    const totalRealUsers = await User.countDocuments();

    res.json({
      user: sanitizeUser(user),
      totalRealUsers: totalRealUsers // 👈 Frontend counter ko ye real count bhej raha hai
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 👤 2. Get Sponsor Name (Registration Verification ke liye)
exports.getSponsorName = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await User.findOne({ userId: parseInt(id) });
    
    if (!sponsor) {
      return res.status(404).json({ message: 'Invalid Sponsor' });
    }
    
    res.json({ name: sponsor.name });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sponsor' });
  }
};

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
  try {
    const users = await User.find().sort({ userId: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};