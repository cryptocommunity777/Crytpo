const express = require("express");
const router = express.Router();
const calculateBalances = require("../services/balanceService");

// GET /api/dashboard/:userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const balances = await calculateBalances(userId);
    res.json(balances);
  } catch (err) {
    console.error("Error in dashboard route:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
