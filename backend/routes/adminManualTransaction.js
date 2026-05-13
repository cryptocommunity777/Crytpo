const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const Admin = require("../models/Admin"); 
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Deposit = require("../models/Deposit");
const bcrypt = require("bcryptjs");

// 💸 POST: Manual Credit/Debit processing
router.post("/manual-transaction", adminAuth, async (req, res) => {
  try {
    console.log("\n--- 👉 Manual Transaction Processing ---");

    // 1. Data Extract karo
    const { userId, amount, type, txHash, reason, adminNote, adminPassword, password } = req.body;
    
    // Admin password handle karein (Frontend se dono naam se aa sakta hai)
    const finalPassword = adminPassword || password;

    if (!finalPassword) {
      return res.status(400).json({ message: "Admin password is required." });
    }

    // 🔍 2. Token se Admin ID nikalo
    const tokenData = req.admin || req.user;
    
    // Token me humesha MongoDB ki unique '_id' (24 characters) hoti hai
    const adminDbId = tokenData.adminId || tokenData.id || tokenData._id;

    console.log(`👉 Searching Admin by DB ID: "${adminDbId}"`);

    // 🔍 3. Database Search (Corrected to use findById)
    // ✅ FIX: Token me jo ID hai wo MongoDB ki '_id' hai, isliye findById use karna hai
    const admin = await Admin.findById(adminDbId);

    if (!admin) {
      console.log("❌ Admin Record Not Found via Token ID.");
      return res.status(404).json({ message: "Admin account not found. Please Re-Login." });
    }

    // 4. Password Verification (Bcrypt)
    const isMatch = await bcrypt.compare(finalPassword, admin.password);
    
    if (!isMatch) {
      console.log("❌ Password Mismatch");
      return res.status(403).json({ message: "Incorrect Admin Password! Access Denied." });
    }

    console.log("✅ Password Matched & Admin Verified!");

    // --- ⬇️ TRANSACTION LOGIC START ---

    if (!userId || !amount || !type)
      return res.status(400).json({ message: "User ID, amount, and type are required." });

    const targetUser = await User.findOne({ userId });
    if (!targetUser) return res.status(404).json({ message: "Target User not found." });

    const amt = parseFloat(amount);
    
    // Duplicate check for TxHash (Agar manual hash provide kiya gaya ho)
    if (txHash) {
      const existingTx = await Transaction.findOne({ txHash });
      const existingDeposit = await Deposit.findOne({ txnHash: txHash });
      if (existingTx || existingDeposit) {
        return res.status(400).json({ message: "TxHash already used." });
      }
    }

    // Update User Wallet Balance
  // Update User Wallet Balance
    if (type === "manual_credit") {
      targetUser.walletBalance += amt;
    } else if (type === "manual_debit") {
      if (targetUser.walletBalance < amt) {
        return res.status(400).json({ message: "Insufficient balance in user's wallet." });
      }
      targetUser.walletBalance -= amt;
    } else {
      return res.status(400).json({ message: "Invalid transaction type." });
    }
    
    // Save User updated balance
    await targetUser.save();

    // 🎯 YAHAN CHANGE KIYA HAI (Dynamic Description ke liye)
    let defaultDescription = type === "manual_credit" 
        ? `Auto-Deposit of ${amt} USDT via BEP-20` 
        : `Auto-Withdrawal deduction of ${amt} USDT`;

    // Create Transaction History Record
  // Create Transaction History Record
    const transaction = new Transaction({
      userId,
      type,
      amount: amt,
      txHash: txHash || `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 
      description: defaultDescription, // ✅ FIX: Ab frontend wala reason hamesha ignore hoga!
      adminNote: adminNote || null,
      source: "manual",
      status: "completed",
      plan: null,
    });

    await transaction.save();

    res.json({
      success: true,
      message: `Successfully ${type === 'manual_credit' ? 'credited' : 'debited'} $${amt} to user ${userId}`,
      transaction,
    });

  } catch (err) {
    console.error("❌ Critical Error:", err);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
});

// 📜 GET: Fetch recent manual transactions for history table
router.get("/manual-transactions", adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filter = { source: "manual" };
        
        const total = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
            
        res.json({ 
            transactions, 
            total, 
            totalPages: Math.ceil(total / limit), 
            currentPage: page 
        });
    } catch (err) {
        console.error("❌ Error loading transactions:", err);
        res.status(500).json({ message: "Error loading transactions" });
    }
});

module.exports = router;