// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\support.js
const express = require("express");
const router = express.Router();
const Support = require("../models/Support");
const authMiddleware = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/adminAuth");

// -----------------------------------------
// 1. Create support (User side)
// -----------------------------------------
router.post("/create", authMiddleware, async (req, res) => {
  const { message, email, walletAddress, optional } = req.body;
  const user = req.user; 

  try {
    const support = await Support.create({
      userId: user.userId,
      name: user.name,
      email: email || user.email,
      referralId: user.referralId || null,
      message,
      walletAddress,
      optional,
      status: "Pending", 
      adminReply: "", // 🔥 Nayi field backend me initialize ho jayegi
    });
    res.status(201).json({ success: true, support });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------
// 2. Get MY supports (User side) 
// -----------------------------------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const supports = await Support.find({ 
      userId: req.user.userId, 
      adminDeleted: false 
    }).sort({ createdAt: -1 });

    res.json({ success: true, supports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------
// 3. Get all supports (Admin side)
// -----------------------------------------
router.get("/all", verifyAdmin, async (req, res) => {
  try {
    const supports = await Support.find({ adminDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, supports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------
// 4. Update status (Admin side)
// -----------------------------------------
router.put("/status/:id", verifyAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const support = await Support.findByIdAndUpdate(
  req.params.id,
  { status },
  { returnDocument: 'after' } // <--- YEH LIKH DO
);
    res.json({ success: true, support });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------
// 🔥 4.5 Send Admin Reply (Admin side) 🔥
// -----------------------------------------
router.put("/reply/:id", verifyAdmin, async (req, res) => {
  const { adminReply, status } = req.body;
  try {
    const support = await Support.findByIdAndUpdate(
      req.params.id,
      { 
        adminReply, 
        status: status || "Resolved" // Default to resolved if replying
      },
      { new: true }
    );
    res.json({ success: true, support });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------
// 5. Soft delete (Admin side)
// -----------------------------------------
router.put("/soft-delete/:id", verifyAdmin, async (req, res) => {
  try {
    const support = await Support.findByIdAndUpdate(
      req.params.id,
      { adminDeleted: true },
      { new: true }
    );
    res.json({ success: true, support });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;