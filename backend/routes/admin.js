const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const verifyAdmin = require('../middleware/adminAuth');
 const LoginHistory = require('../models/LoginHistory');
const IpRule = require('../models/IpRule');
const BlockedDevice = require('../models/BlockedDevice'); // Apna model import karein

const { ethers } = require('ethers');
require('dotenv').config();

// Load environment variables
 const BSC_NODE_URL = process.env.BSC_NODE_URL;
const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;

  
const tokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
];

  

 
// Admin impersonate user
// 🔹 IMPERSONATE USER (Login as User from Admin Panel)
router.post('/impersonate', adminAuth, async (req, res) => {
  try {
    const { userId } = req.body; // Frontend se userId body me aayega

    // 1. Find the target user
    const user = await User.findOne({ userId: Number(userId) }).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🔥 NOTE: Hum yahan "user.isBlocked" check NAHI kar rahe hain.
    // Iska matlab Admin ek blocked user ke account me bhi easily login kar sakta hai.

    // 2. Generate Token (Same format as normal login)
    const userToken = jwt.sign(
      { id: user._id }, // Normal login me _id use hoti hai token me
      process.env.JWT_SECRET || 'yoursecretkey',
      { expiresIn: '1d' } // Admin login 1 din tak chalega
    );

    // 3. Sensitive data hide karein frontend pe bhejte time
    delete user.password;
    delete user.transactionPassword;

    // 4. Send token and user data back to frontend
    res.json({ 
      message: "Impersonation successful",
      token: userToken, 
      user 
    });

  } catch (err) {
    console.error("Impersonation Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard summary
// Dashboard summary (UPDATED FOR ALL CARDS)
// Dashboard summary (UPDATED FOR ALL CARDS - WITH FIX FOR STRINGS & GROSSAMOUNT)
// Dashboard summary (UPDATED WITH 100% BULLETPROOF JS COUNT FOR TOPUPS)
// Dashboard summary
// Dashboard summary
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    // 🔥 INDIA TIMEZONE FIX FOR "TODAY"
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { 
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' 
    });
    
    const parts = formatter.formatToParts(now);
    let month, day, year;
    for (let p of parts) {
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
      if (p.type === 'year') year = p.value;
    }
    
    // Exactly raat 12:00 AM IST
    const startOfTodayIST = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
    const startOfTodayTime = startOfTodayIST.getTime();

    // SAARE ASYNC KAAM EK SATH KARENGE SPEED KE LIYE
    const [
      totalUsers,
      todayUsers,
      paidUsers,
      depositStats,
      withdrawalStats,
      // 🔥 TRANSACTION KI JHANJHAT KHATAM! SIRF USERS KO DIRECT FETCH KARENGE
      allUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfTodayIST } }),
      User.countDocuments({ topUpAmount: { $gt: 0 } }),
      
      // DEPOSIT STATS
      Deposit.aggregate([
        {
          $facet: {
            total: [{ $group: { _id: null, sum: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } } } }],
            today: [
              { $match: { createdAt: { $gte: startOfTodayIST } } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } } } }
            ],
            pendingToday: [
              { $match: { createdAt: { $gte: startOfTodayIST }, status: "pending" } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } } } }
            ]
          }
        }
      ]),

      // WITHDRAWAL STATS (🔥 LEADER AUTO WITHDRAW EXCLUDED FROM NORMAL STATS)
      Withdrawal.aggregate([
        {
          $facet: {
            // ✅ NORMAL TOTALS (Excluding Leader Settlements via address checks or remarks)
            totalAll: [
              { $match: { walletAddress: { $ne: "-" }, remarks: { $ne: "Leader Auto Settlement" } } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: { $ifNull: ["$grossAmount", "$amount"] }, to: "double", onError: 0, onNull: 0 } } } } }
            ],
            approvedTotal: [
              { $match: { status: "approved", walletAddress: { $ne: "-" }, remarks: { $ne: "Leader Auto Settlement" } } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: { $ifNull: ["$grossAmount", "$amount"] }, to: "double", onError: 0, onNull: 0 } } } } }
            ],
            approvedToday: [
              { $match: { createdAt: { $gte: startOfTodayIST }, status: "approved", walletAddress: { $ne: "-" }, remarks: { $ne: "Leader Auto Settlement" } } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: { $ifNull: ["$grossAmount", "$amount"] }, to: "double", onError: 0, onNull: 0 } } } } }
            ],
            pendingTotal: [
              { $match: { status: "pending", walletAddress: { $ne: "-" }, remarks: { $ne: "Leader Auto Settlement" } } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: { $ifNull: ["$grossAmount", "$amount"] }, to: "double", onError: 0, onNull: 0 } } } } }
            ],
            pendingToday: [
              { $match: { createdAt: { $gte: startOfTodayIST }, status: "pending", walletAddress: { $ne: "-" }, remarks: { $ne: "Leader Auto Settlement" } } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: { $ifNull: ["$grossAmount", "$amount"] }, to: "double", onError: 0, onNull: 0 } } } } }
            ],

            // ✅ LEADER AUTO-WITHDRAW BOX CALCULATION (Isme sirf wahi count honge)
            leaderAutoWithdrawTotal: [
              { $match: { $or: [{ remarks: "Leader Auto Settlement" }, { walletAddress: "-" }] } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: { $ifNull: ["$grossAmount", "$amount"] }, to: "double", onError: 0, onNull: 0 } } } } }
            ],
            leaderAutoWithdrawToday: [
              { $match: { createdAt: { $gte: startOfTodayIST }, $or: [{ remarks: "Leader Auto Settlement" }, { walletAddress: "-" }] } },
              { $group: { _id: null, sum: { $sum: { $convert: { input: { $ifNull: ["$grossAmount", "$amount"] }, to: "double", onError: 0, onNull: 0 } } } } }
            ]
          }
        }
      ]),

      // 🔥 SIRF USERS FETCH KARO
      User.find({}, { userId: 1, role: 1, sponsorId: 1, isToppedUp: 1, topUpAmount: 1, createdAt: 1, topUpDate: 1 }).lean()
    ]);

    // ==============================================================
    // 🚀 DIRECT COUNTING ENGINE 
    // ==============================================================
    const userMap = {};
    allUsers.forEach(u => {
      userMap[Number(u.userId)] = u;
    });

    let leaderTopupTotal = 0;
    let leaderTopupToday = 0;
    let normalTopupTotal = 0;
    let normalTopupToday = 0;

    let leaderBusinessTotal = 0;
    let leaderBusinessToday = 0;
    let normalBusinessTotal = 0;
    let normalBusinessToday = 0;

    const specialNormalUsers = [1054948]; 

    allUsers.forEach(user => {
      if (!user.isToppedUp) return;

      const dateToCheck = user.topUpDate || user.createdAt || new Date(0);
      const isToday = new Date(dateToCheck).getTime() >= startOfTodayTime;
      
      let amount = Number(user.topUpAmount) || 30;
      let isLeaderTopup = false;
      const sponsorId = user.sponsorId ? Number(user.sponsorId) : null; 
      const sponsorUser = userMap[sponsorId];

      if (sponsorId && sponsorUser) {
          if (sponsorUser.role === 'leader' || specialNormalUsers.includes(sponsorId)) {
              isLeaderTopup = true;
          }
      }

      if (isLeaderTopup) {
        leaderTopupTotal++;
        leaderBusinessTotal += amount;
        if (isToday) {
          leaderTopupToday++;
          leaderBusinessToday += amount;
        }
      } else {
        normalTopupTotal++;
        normalBusinessTotal += amount;
        if (isToday) {
          normalTopupToday++;
          normalBusinessToday += amount;
        }
      }
    });

    const totalTopupBusiness = leaderBusinessTotal + normalBusinessTotal;
    const todayTopupBusiness = leaderBusinessToday + normalBusinessToday;

    const dep = depositStats[0] || {};
    const withD = withdrawalStats[0] || {};

    res.json({
      totalUsers,
      todayUsers,
      paidUsers,
      
      totalDeposit: dep.total?.[0]?.sum || 0,
      todayDeposit: dep.today?.[0]?.sum || 0,
      pendingDepositToday: dep.pendingDepositToday?.[0]?.sum || dep.pendingToday?.[0]?.sum || 0,
      
      totalWithdrawal: withD.totalAll?.[0]?.sum || 0,
      approvedWithdrawalTotal: withD.approvedTotal?.[0]?.sum || 0,
      approvedWithdrawalToday: withD.approvedToday?.[0]?.sum || 0,
      pendingWithdrawalTotal: withD.pendingTotal?.[0]?.sum || 0,
      pendingWithdrawalToday: withD.pendingToday?.[0]?.sum || 0,

      // ✅ LEADER AUTO-WITHDRAWAL SENT TO FRONTEND
      leaderAutoWithdrawTotal: withD.leaderAutoWithdrawTotal?.[0]?.sum || 0,
      leaderAutoWithdrawToday: withD.leaderAutoWithdrawToday?.[0]?.sum || 0,

      totalTopupBusiness,
      todayTopupBusiness,

      leaderTopupTotal,
      leaderTopupToday,
      normalTopupTotal,
      normalTopupToday,

      leaderBusinessTotal,
      leaderBusinessToday,
      normalBusinessTotal,
      normalBusinessToday
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Dashboard data fetch failed' });
  }
});

// GET /api/admin/stats
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    // 1. 🔥 INDIA (IST) TIMEZONE FIX FOR "TODAY"
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { 
        timeZone: 'Asia/Kolkata', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    
    const parts = formatter.formatToParts(now);
    let month, day, year;
    for (let p of parts) {
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
      if (p.type === 'year') year = p.value;
    }
    
    // Exactly raat 12:00 AM IST
    const startOfTodayIST = new Date(`${year}-${month}-${day}T00:00:00+05:30`);

    // 2. 🔥 DATA FETCH WITH STRING-TO-NUMBER SAFETY
    const totalUsers = await User.countDocuments();
    
    const todayUsers = await User.countDocuments({
      createdAt: { $gte: startOfTodayIST }
    });

    const totalDeposit = await Deposit.aggregate([
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } } 
        } 
      }
    ]);

    const totalWithdrawal = await Withdrawal.aggregate([
      { 
        $group: { 
          _id: null, 
          // grossAmount aur amount dono ko safely check karega
          total: { $sum: { $convert: { input: { $ifNull: ["$grossAmount", "$amount"] }, to: "double", onError: 0, onNull: 0 } } } 
        } 
      }
    ]);

    res.json({
      totalUsers,
      todayUsers,
      totalDeposit: totalDeposit[0]?.total || 0,
      totalWithdrawal: totalWithdrawal[0]?.total || 0
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Stats data fetch failed' });
  }
});










 
// =======================================================
// 1. GET ALL USERS (SERVER-SIDE SEARCH & LEADER DEFAULT)
// =======================================================
router.get('/all-users', verifyAdmin, async (req, res) => {
  try {
    const { search = "", page = 1, limit = 50 } = req.query;
    let query = {};

    if (search.trim()) {
      // 🔍 Agar search kiya hai, toh sabme dhoondo (ID, Name, Email)
      query = {
        $or: [
          { userId: isNaN(search) ? undefined : Number(search) },
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ].filter(Boolean)
      };
    } else {
      // 👑 🔥 NAYA FIX: Agar search khali hai, toh sirf "Leader" dikhao
      query = { role: "leader" };
    }

    // 🔥 FIX: .lean() add kiya hai! 
    const users = await User.find(query)
      .select('-password -transactionPassword') 
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean(); 

    const total = await User.countDocuments(query);

    res.json({ 
      success: true, 
      users, 
      total, 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});


// =======================================================
// 2. UPDATE ROLE & HANDLE $30 LOGIC (TRANSACTION FIX ADDED)
// =======================================================
router.put('/update-role/:userId', verifyAdmin, async (req, res) => {
  try {
    const { newRole, adminPassword } = req.body;
    const targetUserId = req.params.userId;

    if (!adminPassword) {
      return res.status(400).json({ success: false, message: "Admin password is required." });
    }

    // 🔍 1. Token se Admin ID nikalo
    const tokenData = req.admin || req.user;
    const adminDbId = tokenData.adminId || tokenData.id || tokenData._id;

    // 🔍 2. Admin dhundo database me
    const adminRecord = await Admin.findById(adminDbId);
    let isAdminPasswordValid = false;

    if (adminRecord) {
        isAdminPasswordValid = await bcrypt.compare(adminPassword, adminRecord.password);
    } else {
        const adminUser = await User.findById(adminDbId);
        if (adminUser && adminUser.role === 'admin') {
            isAdminPasswordValid = await bcrypt.compare(adminPassword, adminUser.password);
        }
    }

    if (!isAdminPasswordValid) {
      return res.status(400).json({ success: false, message: "Incorrect Admin Password!" }); 
    }

    // 3. Target user update logic
    const targetUser = await User.findOne({ userId: targetUserId });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found" });
    }

    const oldRole = targetUser.role;

    // 🔥 LEADER $30 LOGIC WITH TRANSACTION HISTORY 🔥
    if (oldRole !== 'leader' && newRole === 'leader') {
      targetUser.walletBalance = (targetUser.walletBalance || 0) + 30;
      
      // ✅ Passbook entry (Taki user ko pata chale $30 kahan se aaya)
      await Transaction.create({
        userId: targetUser.userId,
        type: "credit_to_wallet",
        amount: 30,
        source: "admin_bonus",
        description: "Promoted to Leader: $30 Showcase Balance Added",
        status: "success",
        date: new Date()
      });

    } 
    else if (oldRole === 'leader' && newRole !== 'leader') {
      targetUser.walletBalance = Math.max(0, (targetUser.walletBalance || 0) - 30);
      
      // ✅ Passbook entry (Taki deduction ka record rahe)
      await Transaction.create({
        userId: targetUser.userId,
        type: "debit",
        amount: 30,
        source: "admin_deduction",
        description: "Demoted from Leader: $30 Balance Deducted",
        status: "success",
        date: new Date()
      });
    }

    targetUser.role = newRole;
    await targetUser.save();

    res.json({ success: true, message: `User role updated to ${newRole.toUpperCase()} successfully.` });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ success: false, message: "Server Error updating role" });
  }
});
// =======================================================
// 3. DIRECT LOGIN (Impersonation)
// =======================================================
router.post('/direct-login/:userId', verifyAdmin, async (req, res) => {
  try {
    const targetUser = await User.findOne({ userId: req.params.userId });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate token for the target user
    const token = jwt.sign(
      { userId: targetUser.userId, role: targetUser.role },
      process.env.JWT_SECRET, 
      { expiresIn: '12h' }
    );

    res.json({ 
      success: true, 
      token, 
      user: {
        userId: targetUser.userId,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      } 
    });
  } catch (error) {
    console.error("Direct Login Error:", error);
    res.status(500).json({ success: false, message: "Direct login failed" });
  }
});



 

// 🔹 GET /login-stats (For Advanced Login Analytics)
 router.get("/login-stats", verifyAdmin, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query; // NAYA: Range filters
    
    let matchStage = {};
    
    if (fromDate || toDate) {
      matchStage.createdAt = {}; // 🔥 FIX 1: loginTime ko createdAt kiya
      
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        matchStage.createdAt.$gte = start; // 🔥 FIX 2
      }
      
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end; // 🔥 FIX 3
      }
    } else {
      // Default: Only today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchStage = { createdAt: { $gte: today } }; // 🔥 FIX 4
    }

    const userLogins = await LoginHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$userId", 
          name: { $first: "$name" },
          mobile: { $first: "$mobile" }, 
          loginCount: { $sum: 1 }, 
          lastLoginTime: { $max: "$createdAt" } // 🔥 FIX 5: loginTime ko $createdAt kiya
        }
      },
      {
        $project: {
          userId: "$_id",
          name: 1,
          mobile: 1, 
          loginCount: 1,
          lastLoginTime: 1,
          _id: 0
        }
      },
      { $sort: { loginCount: -1 } } 
    ]);

    const totalLoginAttempts = userLogins.reduce((acc, user) => acc + user.loginCount, 0);
    const uniqueUsers = userLogins.length;

    res.json({
      success: true,
      summary: { totalLoginAttempts, uniqueUsers },
      userLogins
    });

  } catch (error) {
    console.error("Error in /login-stats:", error);
    res.status(500).json({ success: false, message: "Error fetching login stats" });
  }
});

// Admin reverses a transaction
 




// 1. 🔍 USER SEARCH (ID daalo, Details aur IP paao)
router.post('/search-user', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found!" });

        // Is user ke IP par aur kitne log hain?
        const usersOnSameIp = await User.find({ ipAddress: user.ipAddress }).select('userId name email');
        
        res.json({ user, usersOnSameIp });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// 2. 🔍 IP SEARCH (IP daalo, uski limit aur logged users paao)
router.post('/search-ip', async (req, res) => {
    try {
        const { ipAddress } = req.body;
        const users = await User.find({ ipAddress }).select('userId name email isBlocked');
        let rule = await IpRule.findOne({ ipAddress });
        
        if (!rule) rule = { ipAddress, limit: 5, isBlocked: false }; // Default

        res.json({ users, rule });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// 3. ⚙️ UPDATE IP RULE (Limit badhana ya IP Block karna)
router.post('/update-ip-rule', async (req, res) => {
    try {
        const { ipAddress, limit, isBlocked } = req.body;
        
        // Validation: ipAddress aana zaroori hai
        if (!ipAddress) {
            return res.status(400).json({ message: "IP Address is required" });
        }

        // 🔥 USE THIS: findOneAndUpdate with Upsert
        // Agar IP milega toh update hoga, nahi toh naya create ho jayega (upsert: true)
        const updatedRule = await IpRule.findOneAndUpdate(
            { ipAddress: ipAddress }, 
            { 
                limit: Number(limit), // 🔥 Number mein convert karna zaroori hai
                isBlocked: Boolean(isBlocked) 
            }, 
            { new: true, upsert: true } 
        );

        res.json({ message: "IP Rules Updated Successfully!", rule: updatedRule });
        
    } catch (err) { 
        console.error("IP Rule Update Error:", err);
        res.status(500).json({ message: "Server error" }); 
    }
});

// 4. 🚫 TOGGLE SPONSOR LINK (Referral Deactivate/Activate)
router.post('/toggle-sponsor', async (req, res) => {
    try {
        const { userId, status } = req.body; // status true = deactivated
        const user = await User.findOneAndUpdate(
            { userId }, 
            { isSponsorDeactivated: status }, 
            { new: true }
        );
        res.json({ message: status ? "Sponsor Link Blocked!" : "Sponsor Link Activated!" });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});


// 📊 5. GET LIVE IP & LOGIN STATS
// 📊 5. GET LIVE IP & LOGIN STATS (Unique Users Only)
// 📊 5. GET LIVE IP & LOGIN STATS (Unique Users Only)
// 📊 backend/routes/admin.js ma aa badlav karo
// 📊 5. GET LIVE IP & LOGIN STATS (OPTIMIZED FOR SPEED)
// 📊 5. GET LIVE IP & LOGIN STATS (OPTIMIZED FOR SPEED - NO LOOPS)
router.get('/live-ip-stats', async (req, res) => {
    try {
        const LoginHistory = require('../models/LoginHistory');
        const User = require('../models/User');

        // 1. Kam data fetch karenge (300 instead of 1000)
        // 2. Final limit 50 kar di hai taaki rendering fast ho
        const recentLogins = await LoginHistory.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: 200 }, 
            { 
                $group: { 
                    _id: "$userId", 
                    name: { $first: "$name" }, 
                    ipAddress: { $first: "$ipAddress" }, 
                    createdAt: { $first: "$createdAt" } 
                } 
            },
            { $sort: { createdAt: -1 } },
            { $limit: 50 } // Sirf top 50 users
        ]);

        if (recentLogins.length === 0) return res.json([]);

        const userIds = recentLogins.map(log => log._id);
        const ipAddresses = [...new Set(recentLogins.map(log => log.ipAddress))];

        // 3. Lean query use kar rahe hain (Fastest way in Mongoose)
        const usersData = await User.find({ userId: { $in: userIds } })
            .select('userId deviceId')
            .lean();

        const userMap = {};
        usersData.forEach(u => { userMap[u.userId] = u.deviceId; });

        // 4. IP counting ko optimize kiya (Aggregating only necessary IPs)
        const ipCountsData = await User.aggregate([
            { $match: { ipAddress: { $in: ipAddresses } } },
            { $group: { _id: "$ipAddress", count: { $sum: 1 } } }
        ]).hint({ ipAddress: 1 }); // Index use karne ke liye hint

        const ipCountMap = {};
        ipCountsData.forEach(ip => { ipCountMap[ip._id] = ip.count; });

        const enrichedData = recentLogins.map(log => ({
            userId: log._id,
            name: log.name,
            ipAddress: log.ipAddress,
            deviceId: userMap[log._id] || "N/A",
            createdAt: log.createdAt,
            totalAccountsOnIp: ipCountMap[log.ipAddress] || 1
        }));

        res.json(enrichedData);
    } catch (err) {
        console.error("Live Stats Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// 1. GET: Saare blocked devices ki list dekhne ke liye (WITH USER ID & NAME)
router.get('/blocked-devices', async (req, res) => {
    try {
        const devices = await BlockedDevice.find().sort({ blockedAt: -1 }).lean();
        
        if (devices.length === 0) return res.json([]);

        // Block list walo ke naam aur ID nikalna (Bina naya data save kiye)
        const deviceIds = devices.map(d => d.deviceId);
        const User = require('../models/User'); // Model zaroor call karna yahan
        const users = await User.find({ deviceId: { $in: deviceIds } }).select('deviceId userId name').lean();

        const userMap = {};
        users.forEach(u => { 
            if (!userMap[u.deviceId]) {
                userMap[u.deviceId] = u; 
            }
        });

        const enrichedDevices = devices.map(device => ({
            ...device,
            userId: userMap[device.deviceId]?.userId || "N/A",
            name: userMap[device.deviceId]?.name || "Unknown"
        }));

        res.json(enrichedDevices);
    } catch (err) {
        console.error("Blocked Devices Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. POST: Naya device block karne ke liye
router.post('/block-device', async (req, res) => {
    try {
        const { deviceId, reason } = req.body;
        if (!deviceId) return res.status(400).json({ message: "Device ID zaroori hai" });

        const exists = await BlockedDevice.findOne({ deviceId });
        if (exists) return res.status(400).json({ message: "Ye device pehle se block hai" });

        const newBlock = new BlockedDevice({ deviceId, reason: reason || "Admin dwara block" });
        await newBlock.save();

        res.json({ message: "✅ Device successfully block ho gaya!" });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. DELETE: Device ko UNBLOCK karne ke liye
router.delete('/unblock-device/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        await BlockedDevice.findOneAndDelete({ deviceId });
        
        res.json({ message: "✅ Device successfully unblock ho gaya!" });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
// ------------------------------------------------------------------
// ✅ TELEGRAM MANAGEMENT ROUTES (ADMIN ONLY)
// ------------------------------------------------------------------

// 1. Unlink / Reset User's Telegram Account
router.put('/user/:userId/reset-telegram', verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.params; // Database ka _id
        
        const updatedUser = await User.findByIdAndUpdate(userId, {
            $unset: { telegramId: "" }, // Telegram ID delete karega
            isTelegramJoined: false     // Status wapas false karega
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ success: true, message: "Telegram account unlinked successfully." });
    } catch (error) {
        console.error("Admin Reset Telegram Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 2. Manual Verify User (Bypass Telegram)
router.put('/user/:userId/manual-verify', verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.params; // Database ka _id
        
        const updatedUser = await User.findByIdAndUpdate(userId, {
            isTelegramJoined: true,
            telegramId: `ADMIN_VERIFIED_${Date.now()}` // Fake ID taaki system error na de
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ success: true, message: "User manually verified by Admin." });
    } catch (error) {
        console.error("Admin Manual Verify Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/admin/deposits
// Fetch all deposits for admin view
// GET /api/admin/deposits
// Fetch all deposits (System + Manual) for admin view
router.get('/deposits', verifyAdmin, async (req, res) => {
  try {
    // 1. Pehle Deposit collection se system deposits laao
    const systemDeposits = await Deposit.find().sort({ createdAt: -1 }).lean();
    
    // 2. Phir Transaction collection se manual deposits laao (Agar wo Deposit collection me nahi hain)
    const manualTxns = await Transaction.find({ 
      type: 'deposit', 
      source: 'manual' 
    }).sort({ createdAt: -1 }).lean();

    // Dono ko mix kar do (par dhyaan rahe ID duplicate na ho)
    const allDeposits = [...systemDeposits];
    
    manualTxns.forEach(tx => {
       // Agar same txnHash wala record pehle se array me nahi hai toh hi daalo
       const exists = allDeposits.some(d => d.txnHash === tx.txnHash);
       if(!exists){
           allDeposits.push({
               _id: tx._id,
               userId: tx.userId,
               amount: tx.amount,
               txnHash: tx.txnHash || `MANUAL-${tx._id.toString().substring(0,8)}`,
               status: tx.status || 'approved',
               createdAt: tx.createdAt || tx.date
           });
       }
    });

    // 3. Naye mix array ko date ke hisaab se sort karo
    allDeposits.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 4. Sabke naam fetch karo
    const userIds = [...new Set(allDeposits.map(dep => dep.userId))];
    const users = await User.find({ userId: { $in: userIds } }, 'userId name').lean();
    const userMap = Object.fromEntries(users.map(u => [u.userId, u.name]));

    // 5. Response me naam daal kar bhejo
    const enrichedDeposits = allDeposits.map(dep => ({
      ...dep,
      name: userMap[dep.userId] || 'Unknown User'
    }));

    res.json(enrichedDeposits);
  } catch (err) {
    console.error('Failed to fetch all deposits:', err);
    res.status(500).json({ message: 'Failed to fetch all deposits' });
  }
});

// PUT: Reverse any transaction by ID
// routes/admin.js
// routes/admin.js (ya jaha tu admin routes rakhta hai)
 

// -----------------------------
// ✅ Bulk Reverse Transactions
// -----------------------------
const { reverseTransactions } = require("../controllers/admin/reverseTransactions");
router.put("/transactions/reverse", verifyAdmin, reverseTransactions);


 




 




// Get all users
// ✅ Protected Route: Get all users (admin only)
// Backend Code (Node.js/Express)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    // 🔥 Frontend ki demand ke hisaab se sab fields add kar diye hain
    // Aur Sponsor Name nikalne ke liye Aggregation ($lookup) use kiya hai
    const users = await User.aggregate([
      {
        $lookup: {
          from: "users", // MongoDB me collection ka naam hamesha lowercase aur plural hota hai
          localField: "sponsorId",
          foreignField: "userId",
          as: "sponsorInfo"
        }
      },
      {
        // Sponsor details array me aati hai, usko object me badalne ke liye
        $unwind: {
          path: "$sponsorInfo",
          preserveNullAndEmptyArrays: true // Agar kisi ka sponsor nahi hai toh bhi wo ID hide nahi hogi
        }
      },
      {
        // 🎯 Sirf wahi data select karo jo frontend par chahiye (Performance ke liye)
        $project: {
          userId: 1,
          name: 1,
          sponsorId: 1,
          sponsorName: "$sponsorInfo.name", // 👈 Sponsor ka asli naam yahan se niklega
          mobile: 1,
          email: 1, 
          depositAddress: 1,
          walletAddress: 1,          // ✅ Withdrawal wallet address
          walletBalance: 1,
          topUpAmount: 1,
          globalTeamCount: 1,        // ✅ My Community
          todayGlobalTeamAdded: 1,   // ✅ Today Community
          createdAt: 1
        }
      },
      {
        $sort: { createdAt: -1 } // Sabse naye users sabse upar dikhenge
      }
    ]);

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});


// Get all users as global team with count and real userIds
router.get('/global-team', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { userId: 1, _id: 0 }).lean();
    const userIds = users.map(u => u.userId);
    res.json({
      totalGlobalTeam: userIds.length,
      userIds: userIds
    });
  } catch (err) {
    console.error('Error fetching global team:', err);
    res.status(500).json({ message: 'Failed to fetch global team' });
  }
});










// POST /auth/register (Admin adds a new user)

// ✅ Admin adds a new user
router.post('/auth/register', verifyAdmin, async (req, res) => {
  try {
    const { name, email, mobile, country, password, txnPassword, sponsorId } = req.body;

    // 1️⃣ Validate required fields
    if (!name || !email || !mobile || !country || !password || !txnPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2️⃣ Check if email or mobile already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile already exists' });
    }

    // 3️⃣ Hash passwords
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedTxnPassword = await bcrypt.hash(txnPassword, 10);

    // 4️⃣ Generate unique userId
    const lastUser = await User.findOne().sort({ createdAt: -1 });
    const userId = lastUser ? lastUser.userId + 1 : 1000;

    // 5️⃣ Create new user document (match schema field name)
    const newUser = new User({
      userId,
      name,
      email,
      mobile,
      country,
      password: hashedPassword,
      transactionPassword: hashedTxnPassword, // ✅ corrected
      sponsorId: sponsorId || null,
      walletBalance: 0,
      directIncome: 0,
      levelIncome: 0,
      planIncome: 0,
      spinIncome: 0,
      roiIncome: 0,
    });

    // 6️⃣ Save to database
    await newUser.save();

    // 7️⃣ Send response
    res.status(201).json({
      message: 'User created successfully',
      userId: newUser.userId
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Server error while creating user' });
  }
});



 

// ✅ Get all blocked users
router.get("/blocked-users", async (req, res) => {
  try {
    const users = await User.find({ isBlocked: true }).sort({ createdAt: -1 });
    // add blockedAt timestamp if you track it
    const formatted = users.map((u) => ({
      _id: u._id,
      userId: u.userId,
      name: u.name,
      email: u.email,
      status: u.isBlocked ? "Blocked" : "Active",
      blockedAt: u.updatedAt, // assuming last update was block time
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Unblock a user
router.put("/unblock-user/:userId", async (req, res) => {
  try {
const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = false;
    await user.save();
    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Optional: Block a user
router.put("/block-user/:userId", async (req, res) => {
  try {
const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = true;
    await user.save();
    res.json({ message: "User blocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// Get all deposits with user names
 





// routes/admin.js

// POST /api/admin/manual-deposit
// GET /api/admin/manual-deposits
// place near other admin routes in routes/admin.js
 
 
 





 



 // Get deduplicated top-up users
 router.get('/topup-users', verifyAdmin, async (req, res) => {
  try {
    const topups = await Transaction.aggregate([
      { 
        $match: { 
          type: 'topup',
          status: { $in: ['success', 'completed'] }, // 🔥 FIX: Sirf successful topups
          $expr: { $eq: ["$userId", "$toUserId"] } // Duplicate filter
        } 
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            // Ek hi din mein same amount ke multiple entries ko group karne ke liye
            date: { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$date", "$createdAt"] } } }
          },
          latest: { $last: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latest" } },
      { $sort: { date: -1 } }
    ]);

    // 🔍 Saare User IDs (Receiver) aur Initiator IDs (Jisne topup kiya) dono ko nikalna
    const allUserIds = new Set();
    topups.forEach(t => {
        if (t.userId) allUserIds.add(Number(t.userId));
        if (t.fromUserId) allUserIds.add(Number(t.fromUserId));
    });

    // 🚀 Users table se Data aur Role fetch karna
    const users = await User.find(
      { userId: { $in: Array.from(allUserIds) } }, 
      { userId: 1, name: 1, mobile: 1, role: 1 }
    ).lean();

    // Fast lookup ke liye userMap banana
    const userMap = {};
    users.forEach(u => userMap[Number(u.userId)] = u);

    // Final result map karna frontend ke liye
    const result = topups.map(tx => {
      // 💰 DECIMAL128 & AMOUNT FIX
      let amountStr = "0";
      if (tx.amount !== undefined && tx.amount !== null) {
          if (tx.amount.$numberDecimal) amountStr = tx.amount.$numberDecimal;
          else amountStr = tx.amount.toString();
      }
      let amount = Number(amountStr) || 0;
      if (amount === 0) amount = 30; // Fallback for old records

      // 👑 ROLE FINDER (Leader ya Normal)
      const initiatorId = Number(tx.fromUserId || tx.userId);
      const initiatorRole = userMap[initiatorId]?.role === 'leader' ? 'leader' : 'normal';

      return {
        _id: tx._id,
        userId: tx.userId,
        name: userMap[Number(tx.userId)]?.name || 'Unknown',
        mobile: userMap[Number(tx.userId)]?.mobile || 'N/A', 
        topUpAmount: amount,
        topUpDate: tx.date || tx.createdAt,
        initiatorRole: initiatorRole // 🔥 NAYA FIELD FRONTEND KE LIYE
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error in /topup-users:', err);
    res.status(500).json({ error: 'Failed to fetch top-up users' });
  }
});














 
 
const REWARD_MILESTONES = [
  { target: 50, strongLeg: 25, otherLegs: 25, reward: 30, title: "Target 1 (50 Points)" },
  { target: 250, strongLeg: 125, otherLegs: 125, reward: 100, title: "Target 2 (250 Points)" },
  { target: 750, strongLeg: 375, otherLegs: 375, reward: 200, title: "Target 3 (750 Points)" },
  { target: 1750, strongLeg: 875, otherLegs: 875, reward: 300, title: "Target 4 (1750 Points)" },
  { target: 3750, strongLeg: 1875, otherLegs: 1875, reward: 500, title: "Target 5 (3750 Points)" },
  { target: 6750, strongLeg: 3375, otherLegs: 3375, reward: 1000, title: "Target 6 (6750 Points)" },
  { target: 11750, strongLeg: 5875, otherLegs: 5875, reward: 1500, title: "Target 7 (11750 Points)" },
  { target: 21750, strongLeg: 10875, otherLegs: 10875, reward: 3000, title: "Target 8 (21750 Points)" }
];

// Helper Function: Mahine ka progress nikalne ke liye
// Helper Function: Mahine ka progress aur EXACT IDs nikalne ke liye
// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\admin.js

// 🔥 Helper Function: Ab ID ke sath Name bhi return karega
const getMonthlyLegStatsForAdmin = async (sponsorId, startOfMonth, endOfMonth) => {
    // 💡 Name field ko bhi fetch kar rahe hain
    const directs = await User.find({ sponsorId: sponsorId }, 'userId name isToppedUp topUpDate');
    
    let legsData = [];

    for (let direct of directs) {
        let currentLegUsers = []; 
        
        if (direct.isToppedUp && direct.topUpDate >= startOfMonth && direct.topUpDate <= endOfMonth) {
            // ID aur Name dono store kar rahe hain
            currentLegUsers.push({ userId: direct.userId, name: direct.name });
        }

        let queue = [direct.userId];
        while (queue.length > 0) {
            const currentId = queue.shift();
            const downlines = await User.find({ sponsorId: currentId }, 'userId name isToppedUp topUpDate');
            
            for (let d of downlines) {
                if (d.isToppedUp && d.topUpDate >= startOfMonth && d.topUpDate <= endOfMonth) {
                    currentLegUsers.push({ userId: d.userId, name: d.name }); 
                }
                queue.push(d.userId);
            }
        }
        
        legsData.push({ size: currentLegUsers.length, usersList: currentLegUsers });
    }

    // Sort by largest leg first
    legsData.sort((a, b) => b.size - a.size);

    let strongLegCount = 0;
    let strongLegUsers = [];
    let otherLegsCount = 0;
    let otherLegUsers = [];

    if (legsData.length > 0) {
        strongLegCount = legsData[0].size;
        strongLegUsers = legsData[0].usersList; 
    }

    if (legsData.length > 1) {
        for (let i = 1; i < legsData.length; i++) {
            otherLegsCount += legsData[i].size;
            otherLegUsers = otherLegUsers.concat(legsData[i].usersList); 
        }
    }

    return { 
        strongLeg: strongLegCount, 
        otherLegs: otherLegsCount, 
        totalTeam: strongLegCount + otherLegsCount,
        strongLegList: strongLegUsers, // Frontend ko List bhejenge
        otherLegList: otherLegUsers    // Frontend ko List bhejenge
    };
};

// 🔥 MAIN API
// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\admin.js

// 🔥 SUPER FAST API: "RAM TREE MAPPING" (0 loops on Database)
router.get('/monthly-reward-progress', async (req, res) => {
    try {
        // 1. Date calculation
        let targetDate = new Date();
        if (req.query.date) {
            const [year, month] = req.query.date.split('-');
            targetDate = new Date(year, month - 1, 1);
        }
        let startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        let endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

        // 2. 🔥 SIRF 1 BAAR DATABASE CALL: Saare users fetch kar lo
        const allUsers = await User.find({}, 'userId sponsorId name isToppedUp topUpDate').lean();

        // 3. 🧠 SERVER KI RAM MEIN NETWORK TREE BANAO (Extremely Fast)
        const userMap = new Map();
        const directMap = new Map(); // sponsorId -> [array of child userIds]

        for (let u of allUsers) {
            userMap.set(u.userId, u);
            if (u.sponsorId) {
                if (!directMap.has(u.sponsorId)) {
                    directMap.set(u.sponsorId, []);
                }
                directMap.get(u.sponsorId).push(u.userId);
            }
        }

        // 4. IN-MEMORY CALCULATION HELPER
        const getLegStatsRAM = (sponsorId) => {
            const directs = directMap.get(sponsorId) || [];
            let legsData = [];

            for (let directId of directs) {
                let currentLegUsers = [];
                const directObj = userMap.get(directId);

                // Direct user check
                if (directObj && directObj.isToppedUp && directObj.topUpDate >= startOfMonth && directObj.topUpDate <= endOfMonth) {
                    currentLegUsers.push({ userId: directObj.userId, name: directObj.name });
                }

                // BFS loop in RAM (No database calls here = 1000x faster)
                let queue = [directId];
                while (queue.length > 0) {
                    const currentId = queue.shift();
                    const downlines = directMap.get(currentId) || [];
                    
                    for (let childId of downlines) {
                        const childObj = userMap.get(childId);
                        if (childObj && childObj.isToppedUp && childObj.topUpDate >= startOfMonth && childObj.topUpDate <= endOfMonth) {
                            currentLegUsers.push({ userId: childObj.userId, name: childObj.name });
                        }
                        queue.push(childId);
                    }
                }

                legsData.push({ size: currentLegUsers.length, usersList: currentLegUsers });
            }

            legsData.sort((a, b) => b.size - a.size);

            let strongLegCount = 0;
            let strongLegUsers = [];
            let otherLegsCount = 0;
            let otherLegUsers = [];

            if (legsData.length > 0) {
                strongLegCount = legsData[0].size;
                strongLegUsers = legsData[0].usersList;
            }
            if (legsData.length > 1) {
                for (let i = 1; i < legsData.length; i++) {
                    otherLegsCount += legsData[i].size;
                    otherLegUsers = otherLegUsers.concat(legsData[i].usersList);
                }
            }

            return {
                strongLeg: strongLegCount,
                otherLegs: otherLegsCount,
                totalTeam: strongLegCount + otherLegsCount,
                strongLegList: strongLegUsers,
                otherLegList: otherLegUsers
            };
        };

        // 5. REPORT GENERATION
        let reportData = [];
        const activeUsers = allUsers.filter(u => u.isToppedUp);

        for (let user of activeUsers) {
            // Memory me bane function ko call kar rahe hain (Very fast)
            const stats = getLegStatsRAM(user.userId);
            
            if (stats.totalTeam > 0) {
                let achieved = null;
                let nextTarget = REWARD_MILESTONES[0]; 

                for (let i = 0; i < REWARD_MILESTONES.length; i++) {
                    const m = REWARD_MILESTONES[i];
                    if (stats.strongLeg >= m.strongLeg && stats.otherLegs >= m.otherLegs) {
                        achieved = m;
                        nextTarget = REWARD_MILESTONES[i + 1] || m; 
                    }
                }

                reportData.push({
                    userId: user.userId,
                    name: user.name || "User",
                    strongLeg: stats.strongLeg,
                    otherLegs: stats.otherLegs,
                    totalTeam: stats.totalTeam,
                    strongLegList: stats.strongLegList,
                    otherLegList: stats.otherLegList,
                    achievedReward: achieved ? achieved.reward : 0,
                    achievedTitle: achieved ? achieved.title : "Not Qualified",
                    nextTargetReward: nextTarget.reward,
                    nextTargetStrong: nextTarget.strongLeg,
                    nextTargetOther: nextTarget.otherLegs
                });
            }
        }

        reportData.sort((a, b) => b.totalTeam - a.totalTeam);
        res.json({ success: true, data: reportData });

    } catch (error) {
        console.error("Admin Monthly Reward Progress Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// ==========================================
// 1. OPTIMIZED TRANSACTIONS ROUTE
// ==========================================
// ==========================================
// 1. OPTIMIZED TRANSACTIONS ROUTE
// ==========================================
// ==========================================
// 1. FULL TRANSACTIONS ROUTE (NO LIMIT)
// ==========================================
router.get("/transactions", verifyAdmin, async (req, res) => {
  try {
    // 🔥 LIMIT HATA DI HAI - Ab shuru se lekar end tak saara data aayega
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .lean(); // Lean = Super Fast Query for bulk data

    // Smart Fetch: Sirf related users laayega memory save karne ke liye
    const userIds = [...new Set(
      transactions.flatMap(tx => [tx.userId, tx.fromUserId, tx.toUserId]).filter(Boolean)
    )];

    const users = await User.find({ userId: { $in: userIds } }, { userId: 1, name: 1 }).lean();
    const userMap = Object.fromEntries(users.map(u => [u.userId, u.name]));

    const formatted = transactions.map(tx => {
      // Decimal128 handling jisse amount kabhi kharab ya 0 nahi hoga
      let safeAmount = 0;
      if (tx.amount) {
        if (tx.amount.$numberDecimal) safeAmount = parseFloat(tx.amount.$numberDecimal);
        else safeAmount = parseFloat(tx.amount.toString()) || 0;
      }

      return {
        _id: tx._id,
        userId: tx.userId,
        name: userMap[tx.userId] || "Unknown",
        type: tx.type,
        amount: safeAmount, 
        source: tx.source || "-",          
        description: tx.description || "",  
        fromUserId: tx.fromUserId || null,
        toUserId: tx.toUserId || null,
        fromName: tx.fromUserId ? (userMap[tx.fromUserId] || "N/A") : "-",
        toName: tx.toUserId ? (userMap[tx.toUserId] || "N/A") : "-",
        package: tx.package || null,
        plan: tx.plan || null,
        level: tx.level || null,
        date: tx.date || tx.createdAt || new Date(),
        createdAt: tx.createdAt || new Date(),
        updatedAt: tx.updatedAt || new Date(),
        txnHash: tx.txnHash || tx.txHash || null, 
        status: tx.status || "completed"
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Failed to fetch all transactions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});


// ==========================================
// 2. FULL DEPOSITS ROUTE (NO LIMIT)
// ==========================================
router.get('/deposits', verifyAdmin, async (req, res) => {
  try {
    // 🔥 LIMIT HATA DI HAI - Saare deposits ek sath fetch honge
    const deposits = await Deposit.find()
      .sort({ createdAt: -1 })
      .lean(); 

    const userIds = [...new Set(deposits.map(dep => dep.userId).filter(Boolean))];
    const users = await User.find({ userId: { $in: userIds } }, { userId: 1, name: 1 }).lean();
    const userMap = Object.fromEntries(users.map(u => [u.userId, u.name]));

    const enriched = deposits.map(dep => {
      let safeAmount = 0;
      if (dep.amount) {
        if (dep.amount.$numberDecimal) safeAmount = parseFloat(dep.amount.$numberDecimal);
        else safeAmount = parseFloat(dep.amount.toString()) || 0;
      }

      return {
        ...dep,
        name: userMap[dep.userId] || 'Unknown',
        amount: safeAmount
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('Failed to fetch all deposits:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
});



router.get('/direct-income', verifyAdmin, async (req, res) => {
  try {
    const { userId, fromDate, toDate } = req.query;
    const filter = { type: 'direct_income' };

    if (userId) filter.userId = Number(userId);
    if (fromDate || toDate) filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);

    // Fetch transactions
    const incomes = await Transaction.find(filter).sort({ createdAt: -1 });

    // Format response (no names, just IDs)
    const formatted = incomes.map(inc => ({
      _id: inc._id,
      userId: inc.userId,
      fromUserId: inc.fromUserId || '-',
      packageName: inc.package || '-',
      amount: inc.amount,
      createdAt: inc.createdAt,
    }));

    res.json(formatted);

  } catch (err) {
    console.error('Error fetching direct incomes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Route: GET /api/admin/level-income
// Route: GET /api/admin/level-income
// Route: GET /api/admin/level-income
router.get('/level-income', verifyAdmin, async (req, res) => {
  try {
    const { userId, fromDate, toDate, level } = req.query;
    const filter = { type: 'level_income' };

    // Filter by userId if provided
    if (userId) filter.userId = Number(userId);

    // Filter by level if provided
    if (level) filter.level = Number(level);

    // Filter by date range
    if (fromDate || toDate) filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);

    // Fetch transactions
    const incomes = await Transaction.find(filter).sort({ createdAt: -1 });

    // Format response
    const formatted = incomes.map(inc => ({
      _id: inc._id,
      userId: inc.userId,
      fromUserId: inc.fromUserId || '-',
      packageName: inc.package || '-',
      amount: inc.amount,
      level: inc.level || '-',       // <-- added level
      createdAt: inc.createdAt,
    }));

    res.json(formatted);

  } catch (err) {
    console.error('Error fetching level incomes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});





// GET /api/admin/spin-income

// 🔹 Admin: Update user spins or transaction amount
 




router.get('/wallet-summary', verifyAdmin, async (req, res) => {
  try {
    const { userId, fromDate, toDate, type, search } = req.query;

    const filter = {};

    // User filter
    if (userId) filter.userId = Number(userId);

    // Date filter
    if (fromDate || toDate) filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endOfDay;
    }

    // Type filter
    if (type && type !== "all") filter.type = type;

    // Fetch transactions
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    // Collect unique userIds
    const userIds = [...new Set(transactions.map(tx => tx.userId))];

    // Fetch users with balances
    const users = await User.find(
      { userId: { $in: userIds } },
      {
        userId: 1,
        name: 1,
        walletBalance: 1,
        directIncome: 1,
        levelIncome: 1,
        planIncome: 1,
        spinIncome: 1,
        roiIncome: 1,
      }
    );

    // Build user map
    const userMap = Object.fromEntries(
      users.map(u => [
        u.userId,
        {
          name: u.name,
          walletBalance: u.walletBalance || 0,
          directIncome: u.directIncome || 0,
          levelIncome: u.levelIncome || 0,
          planIncome: u.planIncome || 0,
          spinIncome: u.spinIncome || 0,
          roiIncome: u.roiIncome || 0,
        },
      ])
    );

    // Format response
    let formatted = transactions.map(tx => ({
      _id: tx._id,
      userId: tx.userId,
      name: userMap[tx.userId]?.name || "-",
      type: tx.type,          // deposit, withdrawal, transfer, etc.
      amount: tx.amount,
      description: tx.description || "-", // optional
      createdAt: tx.createdAt,
      walletBalance: userMap[tx.userId]?.walletBalance || 0,
      directIncome: userMap[tx.userId]?.directIncome || 0,
      levelIncome: userMap[tx.userId]?.levelIncome || 0,
      planIncome: userMap[tx.userId]?.planIncome || 0,
      spinIncome: userMap[tx.userId]?.spinIncome || 0,
      roiIncome: userMap[tx.userId]?.roiIncome || 0,
    }));

    // Search filter (matches id/name/type/description)
    if (search) {
      const lower = search.toLowerCase();
      formatted = formatted.filter(
        tx =>
          tx.userId?.toString().includes(lower) ||
          tx.name?.toLowerCase().includes(lower) ||
          tx.type?.toLowerCase().includes(lower) ||
          tx.description?.toLowerCase().includes(lower)
      );
    }

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching wallet summary:", err);
    res.status(500).json({ message: "Server error" });
  }
});


 

// ------------------------- CREDIT TO WALLET -------------------------
// Route: POST /credit
// Purpose: Transfer funds from a user's income (direct, level, spin) to their wallet balance
// Request Body:
// {
//   userId: Number,
//   transactionPassword: String,
//   credits: [
//     { source: "direct" | "level" | "spin", amount: Number }
//   ]
// }

router.post("/credit", async (req, res) => {
  try {
    const { userId, credits, transactionPassword } = req.body;

    // 1️⃣ Transaction password must be provided
    if (!transactionPassword)
      return res.status(400).json({
        success: false,
        message: "Transaction password is required",
      });

    // 2️⃣ Find the user by userId
    const user = await User.findOne({ userId });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // 3️⃣ Validate transaction password
    const isPasswordValid = await bcrypt.compare(transactionPassword, user.transactionPassword);
    if (!isPasswordValid)
      return res.status(401).json({ success: false, message: "Invalid transaction password" });

    // 4️⃣ Validate each credit item
    for (const { source, amount } of credits) {
      // Check valid source and positive amount
      if (amount <= 0 || !["direct", "level", "spin"].includes(source)) {
        return res.status(400).json({
          success: false,
          message: `Invalid credit source or amount for "${source}"`,
        });
      }

      // Check user has enough balance in the selected income
      if (amount > user[`${source}Income`]) {
        return res.status(400).json({
          success: false,
          message: `Cannot credit more than available ${source} balance`,
        });
      }
    }

    // 5️⃣ Apply credits
    for (const { source, amount } of credits) {
      // Deduct from user's income
      user[`${source}Income`] -= amount;

      // Add to wallet balance
      user.walletBalance += amount;

      // Record transaction in database
      await Transaction.create({
        userId: user.userId,
        type: "credit_to_wallet",      // Transaction type
        source,                        // Income source
        amount,                        // Amount credited
        description: `Credited $${amount} from ${source} income to wallet`,
        createdAt: new Date(),         // Timestamp
      });
    }

    // 6️⃣ Save updated user balances
    await user.save();

    // 7️⃣ Return response with updated balances
    res.json({
      success: true,
      message: "Credits added to wallet successfully",
      walletBalance: user.walletBalance,
      incomes: {
        direct: user.directIncome,
        level: user.levelIncome,
        spin: user.spinIncome,
      },
    });
  } catch (err) {
    // 8️⃣ Handle unexpected server errors
    console.error("Credit Wallet Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while crediting wallet",
    });
  }
});



 
// GET /api/admin/withdrawals
 

// GET all withdrawals with user info and schedule
// GET all withdrawals (flattened with schedule)
// GET /api/admin/withdrawals
// GET /api/admin/withdrawals
router.get('/withdrawals', verifyAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }).lean();
    const users = await User.find({}, { userId: 1, name: 1, walletAddress: 1 }).lean();

    // userId → name, wallet
    const userMap = users.reduce((acc, u) => {
      acc[String(u.userId)] = {
        name: u.name || '-',
        walletAddress: u.walletAddress || ''
      };
      return acc;
    }, {});

    const showAll = req.query.all === 'true';

    const parseDate = (str) => {
      if (!str) return null;
      const [d, m, y] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    const normalizeDate = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = normalizeDate(new Date());

    const fromDate = req.query.from
      ? normalizeDate(parseDate(req.query.from))
      : today;

    const toDate = req.query.to
      ? normalizeDate(parseDate(req.query.to))
      : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const isInRange = (date) => {
      const d = normalizeDate(new Date(date));
      return d >= fromDate && d <= toDate;
    };

    const flattened = withdrawals.flatMap((w) => {
      const userKey = String(w.userId);

      // 🔹 NAME RESOLVE
      const resolvedName =
        w.name && String(w.name).trim() !== '-'
          ? w.name
          : userMap[userKey]?.name || '-';

      // 🔹 NON-SCHEDULE WALLET (parent)
      const parentWallet =
        w.status === 'approved'
          ? (w.walletAddress || '')
          : (w.walletAddress || userMap[userKey]?.walletAddress || '');

      // 🔹 WITH SCHEDULE
      if (Array.isArray(w.schedule) && w.schedule.length > 0) {
        let remainingGross = Number(w.grossAmount || 0);

        return w.schedule.map((day, index) => {
          const gross = Math.min(Number(day.grossAmount || 0), remainingGross);
          const fee = Number(day.fee || 0);
          const net = +(gross - fee).toFixed(2);
          remainingGross -= gross;

          const dateObj = day.date
            ? new Date(day.date)
            : new Date(new Date(w.createdAt).getTime() + index * 1000);

          // 🔐 FINAL WALLET LOCK LOGIC (DAY-WISE)
          const finalWallet =
            day.status === 'approved'
              ? (day.walletAddress || '')
              : (
                  day.walletAddress ||
                  w.walletAddress ||
                  userMap[userKey]?.walletAddress ||
                  ''
                );

          return {
            _id: `${w._id}-${index}`,
            withdrawalId: w._id,
            userId: w.userId,
            name: resolvedName,
            walletAddress: finalWallet, // ✅ FIXED
            source: w.source,
            grossAmount: gross,
            fee,
            netAmount: net,
            status: day.status || 'pending',
            date: dateObj,
            txnHash: w.txnHash || '',
            isInRange: isInRange(dateObj),
          };
        });
      }

      // 🔹 NO SCHEDULE (single withdrawal)
      const dateObj = new Date(w.createdAt);

      return [{
        _id: w._id,
        withdrawalId: w._id,
        userId: w.userId,
        name: resolvedName,
        walletAddress: parentWallet, // ✅ FIXED
        source: w.source,
        grossAmount: Number(w.grossAmount || 0),
        fee: Number(w.fee || 0),
        netAmount: +(Number(w.grossAmount || 0) - Number(w.fee || 0)).toFixed(2),
        status: w.status || 'pending',
        date: dateObj,
        txnHash: w.txnHash || '',
        isInRange: isInRange(dateObj),
      }];
    });

    const result = showAll ? flattened : flattened.filter(r => r.isInRange);
    result.sort((a, b) => b.grossAmount - a.grossAmount);

    res.json({ success: true, withdrawals: result });
  } catch (err) {
    console.error("Withdrawals fetch error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});





// APPROVE a withdrawal (single withdrawal record)
// Sirf status update karne ke liye
router.put('/withdrawals/approve/:id', verifyAdmin, async (req, res) => {
  try {
    const fullId = req.params.id;
    const { txnHash } = req.body;

    // 1. Agar ID mein '-' hai (matlab schedule wali row hai), toh asli ID alag karo
    let actualId = fullId;
    let dayIndex = null;

    if (fullId.includes('-')) {
      const parts = fullId.split('-');
      actualId = parts[0]; // Ye asli MongoDB ID hogi
      dayIndex = parseInt(parts[1]); // Ye schedule ka index hoga
    }

    const withdrawal = await Withdrawal.findById(actualId);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    // 2. Agar schedule hai, toh sirf us din ko approve karo
    if (dayIndex !== null && withdrawal.schedule && withdrawal.schedule[dayIndex]) {
      withdrawal.schedule[dayIndex].status = "approved";
      
      // Agar saare days approve ho gaye, toh main status bhi approve kar do
      const allDone = withdrawal.schedule.every(d => d.status === "approved");
      if (allDone) {
        withdrawal.status = "approved";
        withdrawal.txnHash = txnHash;
      }
    } else {
      // 3. Normal withdrawal (binna schedule wala)
      withdrawal.status = "approved";
      withdrawal.txnHash = txnHash;
    }

    await withdrawal.save();
    res.json({ success: true, message: "Approved successfully", withdrawal });

  } catch (err) {
    console.error("Approve Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});



// APPROVE a dummy txn with txnHash
// ✅ Dummy Transaction Route (Fixed for Schedule IDs)
router.put('/withdrawals/dummy/:id', verifyAdmin, async (req, res) => {
  try {
    const { txnHash } = req.body;
    if (!txnHash) return res.status(400).json({ message: 'Transaction hash required' });

    const fullId = req.params.id;
    let actualId = fullId;
    let dayIndex = null;

    // 1. Agar ID mein '-' hai, toh asli ID aur index nikaalo
    if (fullId.includes('-')) {
      const parts = fullId.split('-');
      actualId = parts[0];
      dayIndex = parseInt(parts[1]);
    }

    const withdrawal = await Withdrawal.findById(actualId);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    // 2. Agar schedule hai, toh sirf us specific din ko approve karo
    if (dayIndex !== null && withdrawal.schedule && withdrawal.schedule[dayIndex]) {
      withdrawal.schedule[dayIndex].status = 'approved';
      withdrawal.schedule[dayIndex].walletAddress = withdrawal.schedule[dayIndex].walletAddress || withdrawal.walletAddress;
      
      // Check agar saare days done hain
      const allDone = withdrawal.schedule.every(day => day.status === 'approved');
      if (allDone) {
        withdrawal.status = 'approved';
        withdrawal.txnHash = txnHash;
      }
    } else {
      // 3. Normal withdrawal ke liye
      withdrawal.status = 'approved';
      withdrawal.txnHash = txnHash;
    }

    await withdrawal.save();
    res.json({ success: true, message: 'Dummy transaction approved' });
  } catch (err) {
    console.error("Dummy Approve Error:", err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// REJECT a withdrawal
router.put('/withdrawals/reject/:id', verifyAdmin, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    if (Array.isArray(withdrawal.schedule)) {
      withdrawal.schedule = withdrawal.schedule.map(day => ({ ...day, status: 'rejected' }));
    }
    withdrawal.status = 'rejected';
    await withdrawal.save();

    res.json({ success: true, message: 'Withdrawal rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});




// Admin update user password
router.put('/admin/update-password/:userId', verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ message: 'Password must be at least 4 characters long.' });
  }

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ system updated password for userId ${userId}`);
    res.json({ message: 'Password updated successfully by system' });
  } catch (error) {
    console.error("❗ Error updating password:", error);
    res.status(500).json({ message: 'Server error' });
  }
});



// ✅ Corrected Route for Admin User Search (Added here)
// Isse admin kisi bhi ek user ko search karega toh usko plain text password dikhega
router.get('/user/:userId', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findOne({ userId: Number(req.params.userId) }).lean();
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Yahan hum password aur transactionPassword hide NAHI kar rahe hain
    res.json({ user: user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// routes/admin.js ke andar
// routes/admin.js ke andar
router.get('/search-user/:userId', verifyAdmin, async (req, res) => {
  try {
    // 1. Pehle user ko dhundo
    const user = await User.findOne({ userId: Number(req.params.userId) }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. ✅ NAYA LOGIC: Agar iska koi sponsorId hai, toh database se uska naam nikalo
    if (user.sponsorId) {
      const sponsor = await User.findOne({ userId: Number(user.sponsorId) }).select('name').lean();
      // Agar sponsor mila toh uska naam daalo, warna "Unknown" likh do
      user.sponsorName = sponsor ? sponsor.name : "Unknown"; 
    } else {
      user.sponsorName = "N/A"; // Agar kisi ne refer nahi kiya
    }

    // Ensure we are sending EVERYTHING, including passwords and the new sponsorName
    res.json({ user: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Admin update user data safely
// ✅ Admin update user + update ONLY pending withdrawals wallet address
// 🔐 Admin update user (FINAL)
// 🔐 Admin update user (FINAL - Updated to Plain Text Password)
router.put('/:userId', verifyAdmin, async (req, res) => {
  try {
    const { password, transactionPassword, walletAddress, ...otherFields } = req.body;
    const updateData = { ...otherFields };

    if (walletAddress) updateData.walletAddress = walletAddress;
    
    // ✅ Yahan se bcrypt hata diya hai. Seedha save hoga.
    if (password) updateData.password = password;
    if (transactionPassword) updateData.transactionPassword = transactionPassword;

    const updatedUser = await User.findOneAndUpdate(
      { userId: Number(req.params.userId) },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 ONLY PENDING WITHDRAWALS UPDATE
    if (walletAddress) {
      await Withdrawal.updateMany(
        { userId: Number(req.params.userId), status: "pending" },
        { $set: { walletAddress } }
      );
      await Withdrawal.updateMany(
        {
          userId: Number(req.params.userId),
          "schedule.status": "pending"
        },
        {
          $set: { "schedule.$[elem].walletAddress": walletAddress }
        },
        {
          arrayFilters: [{ "elem.status": "pending" }]
        }
      );
    }

    res.json({
      message: "✅ User updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("❌ User update failed:", err);
    res.status(500).json({ message: "Update failed" });
  }
});



module.exports = router;
