const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const router = express.Router();
const crypto = require('crypto'); // 👈 YE LINE SABSE ZARURI HAI
// 🔐 Admin Login
router.post("/login", async (req, res) => {
  const { adminId, password } = req.body;

  try {
    // ✅ find by adminId (correct field in schema)
const hashedInputId = crypto.createHash("sha256").update(adminId).digest("hex");

    // 👇 STEP 2: Ab us Hash ko database me dhundo
    const admin = await Admin.findOne({ adminId: hashedInputId });

    
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // generate token
    const token = jwt.sign(
      { adminId: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "300m" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
