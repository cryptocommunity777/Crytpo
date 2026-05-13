// controllers/dashboardController.js
const calculateBalances = require("../services/balanceService");

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id; // assuming JWT auth middleware sets req.user
    const balances = await calculateBalances(userId);

    res.json({
      success: true,
      message: "Dashboard data fetched successfully",
      balances
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
