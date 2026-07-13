const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); // 🔥 Naya OTP ke liye

// Models
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const TopUp = require('../models/TopUp'); 
const DummyTransaction = require('../models/DummyTransaction');
const DummyUser = require('../models/DummyUser.js'); 
const FastTrack = require('../models/FastTrack');
const FakeUser = require('../models/FakeUser');

// Middleware & Utils
const authMiddleware = require('../middleware/authMiddleware');
const checkFeature = require("../middleware/checkFeatureEnabled");
const { bot } = require('../utils/telegramBot');

// ==========================================
// 🔥 SMTP Transporter Setup (OTP ke liye)
// ==========================================
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 👇 ISKE NICHE AAPKE SAARE ROUTES (API) AAYENGE 👇
// Controllers
// Controllers ko import kiya
const {
  getUserById,
  blockUser,
  unblockUser,
  getAllUsers,
  getSponsorName // 👈 Ye add kiya hai naye logic ke liye
} = require('../controllers/userController');

// ==========================================
// 🚀 ROUTES DEFINITION
// ==========================================


// =========================================================================
// 🔥 NEW SMART CAPPING ENGINE FOR REAL TOPUPS (SYNCED WITH CRON)
// =========================================================================
const processGlobalTeamGrowth = async (excludeUserId) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Sirf Active Users ko uthayenge aur jisne ID lagayi hai (excludeUserId) usko chhod denge
    const activeUsers = await User.find({ isToppedUp: true, userId: { $ne: excludeUserId } })
        .select('_id globalTeamCount directCount todayGlobalTeamAdded lastGlobalTeamAddDate');

    const bulkOps = [];

    for (const user of activeUsers) {
        const team = user.globalTeamCount || 0;
        const directs = user.directCount || 0;

        // Daily limit reset check (Sirf Admin panel me dikhane ke liye chahiye)
        let todayAdded = user.todayGlobalTeamAdded || 0;
        if (user.lastGlobalTeamAddDate !== todayStr) {
            todayAdded = 0;
        }

        // --- STEP 1: STRICT MILESTONE LOCKS (Level 6 Tak Free Growth) ---
        let isLocked = false;
        
        // 🔥 Level 5 (760) ka lock hata diya. Ab seedha Level 6 (2360) par lock lagega
        if (team === 2360 && directs < 6) isLocked = true;       // Level 6 to 7
        else if (team === 4360 && directs < 8) isLocked = true;  // Level 7 to 8
        else if (team === 7360 && directs < 10) isLocked = true; // Level 8 to 9
        else if (team === 11360 && directs < 12) isLocked = true; // Level 9 to 10
        else if (team === 16360 && directs < 14) isLocked = true; // Level 10 to 11
        else if (team === 23860 && directs < 16) isLocked = true; // Level 11 to 12
        else if (team === 33860 && directs < 18) isLocked = true; // Full Plan Complete

        if (isLocked) continue; // Agar exact milestone par direct kam hain, toh yahin Jam/Freeze kardo.

        // --- STEP 2: DAILY CAPPING LOGIC (REMOVED COMPLETELY) ---
        // Ab koi daily limit nahi hai, natural badhega.

        // --- STEP 3: BULK UPDATE PREPARATION ---
        if (user.lastGlobalTeamAddDate !== todayStr) {
            // 🔄 NAYA DIN AAYA HAI: Aaj ka count DB me 1 se restart karo
            bulkOps.push({
                updateOne: {
                    filter: { _id: user._id },
                    update: {
                        $inc: { globalTeamCount: 1 },
                        $set: { todayGlobalTeamAdded: 1, lastGlobalTeamAddDate: todayStr }
                    }
                }
            });
        } else {
            // ⏩ SAME DIN HAI: Normal increment karte raho
            bulkOps.push({
                updateOne: {
                    filter: { _id: user._id },
                    update: {
                        $inc: { globalTeamCount: 1, todayGlobalTeamAdded: 1 },
                        $set: { lastGlobalTeamAddDate: todayStr }
                    }
                }
            });
        }
    }

    // Ek sath sabhi users ko DB mein update karo
    if (bulkOps.length > 0) {
        await User.bulkWrite(bulkOps);
    }
};








// 📋 Get all users (Admin ke liye)
router.get('/all', getAllUsers);

// 👤 Get Sponsor Name (Register page par verification ke liye)
router.get('/sponsor/:id', getSponsorName);

// 🔒 Block user (Admin)
router.put('/block/:id', blockUser);

// 🔓 Unblock user (Admin)
router.put('/unblock/:id', unblockUser);

 
// 🔍 Get User By ID (Dashboard data, real + fake count yahan se jayega)
// ⚠️ ISE SABSE NEECHE HI RAKHNA HAI
router.get('/:userId', authMiddleware, getUserById); // Ye to sabse pehle hona chahiye
// 
// // ---------------------------
// Helper: Check if target is in downline
const isUserInDownline = async (rootUserId, targetUserId) => {
  const visited = new Set();
  const queue = [rootUserId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const downlines = await User.find({ sponsorId: current }).select('userId');
    for (const user of downlines) {
      if (user.userId === targetUserId) return true;
      queue.push(user.userId);
    }
  }

  return false;
};

// ---------------------------
// Referral Tree
router.get('/tree/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const referrals = await User.find({ sponsorId: userId });

    const tree = {
      userId: user.userId,
      name: user.name,
      children: referrals.map(r => ({ userId: r.userId, name: r.name, children: [] }))
    };

    res.json(tree);
  } catch (err) {
    console.error('Error generating tree:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/// Helper Function: Pure Team Count nikalne ke liye (Recursive)
// Isko route ke bahar ya andar define kar sakte hain
const getDownlineCount = async (sponsorId) => {
  const referrals = await User.find({ sponsorId: Number(sponsorId) });
  let count = referrals.length;
  for (const r of referrals) {
    count += await getDownlineCount(r.userId);
  }
  return count;
};







// Apni backend user routes wali file mein (e.g., routes/user.js)
const SystemSettings = require('../models/SystemSettings'); // Path check kar lena

// routes/user.js

// 1. Static route ko upar rakhein (Isko pehle check karega)
router.get('/system-settings', async (req, res) => {
    try {
        const SystemSettings = require('../models/SystemSettings');
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                depositEnabled: true, topupEnabled: true, 
                transferEnabled: true, withdrawEnabled: true, toWalletEnabled: true
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching settings" });
    }
});

// 2. Dynamic route ko neeche rakhein
// Express yahan tabhi aayega agar path 'system-settings' nahi hoga
router.get('/:userId', getUserById); 














// =========================================================
// 🔥 SECURE PROFILE UPDATE & WALLET ROUTES
// =========================================================

// 1. Send OTP to Email (SECURED)
// Ab authMiddleware laga diya hai, aur req.body.userId nahi balki token se userId nikal rahe hain.
// router.post('/send-edit-otp', authMiddleware, async (req, res) => {
//     try {
//         const user = await User.findOne({ userId: req.user.userId }); // 🔥 ALWAYS use req.user.userId
//         if (!user) return res.status(404).json({ message: "User not found" });

//         // Generate 6 digit OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         user.editProfileOtp = otp;
//         user.editProfileOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
//         await user.save();

//         const mailOptions = {
//             from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
//             to: user.email,
//             subject: 'OTP for Profile Update',
//             html: `<h3>Your Profile Edit OTP</h3>
//                    <p>Your OTP to unlock profile editing is: <b style="font-size:20px; color:green;">${otp}</b></p>
//                    <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>`
//         };

//         // Note: Assumes transporter is defined elsewhere in your file
//         await transporter.sendMail(mailOptions);
//         res.json({ success: true, message: "OTP sent to your registered email." });
//     } catch (error) {
//         console.error("OTP Error:", error);
//         res.status(500).json({ success: false, message: "Failed to send OTP." });
//     }
// });

router.post('/send-edit-otp', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId }); // 🔥 ALWAYS use req.user.userId
        if (!user) return res.status(404).json({ message: "User not found" });

        // 🕒 RATE LIMITING LOGIC: Din mein sirf 3 OTP
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Aaj raat 12:00 AM ka time

        // Agar last OTP request aaj se pehle ki hai (kal ki ya purani), toh count 0 kardo (Reset)
        if (!user.lastOtpRequestDate || user.lastOtpRequestDate < startOfToday) {
            user.otpRequestCount = 0; 
        }

        // Limit Check: Agar count 3 ya usse zyada hai, toh error de do
        if (user.otpRequestCount >= 3) {
            return res.status(429).json({ 
                success: false, 
                message: "Daily limit exceeded. You can only request OTP 3 times a day." 
            });
        }

        // 🔐 Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.editProfileOtp = otp;
        user.editProfileOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

        // Update limit count aur date
        user.otpRequestCount += 1; 
        user.lastOtpRequestDate = now;

        await user.save();

        // 📧 SEND REAL EMAIL (Ab bypass hٹا diya gaya hai)
        const mailOptions = {
            from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'OTP for Profile Update',
            html: `<h3>Your Profile Edit OTP</h3>
                   <p>Your OTP to unlock profile editing is: <b style="font-size:20px; color:green;">${otp}</b></p>
                   <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>`
        };

        // Note: Assumes transporter is defined elsewhere in your file
        await transporter.sendMail(mailOptions);
        
        // Success response (Clean)
        res.json({ success: true, message: "OTP sent to your registered email." });
        
    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP." });
    }
});

// 2. Verify OTP (SECURED)
// Isme bhi authMiddleware add kiya gaya hai
router.post('/verify-edit-otp', authMiddleware, async (req, res) => {
    try {
        const { otp } = req.body; // userId body se nahi lena!
        const user = await User.findOne({ userId: req.user.userId }); // 🔥 Secure check

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found." });
        }

        if (!user.editProfileOtp || user.editProfileOtpExpiry < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP has expired or was not requested." });
        }

        if (String(user.editProfileOtp) !== String(otp)) {
            return res.status(400).json({ success: false, message: "Invalid OTP." });
        }

        // OTP Sahi hai! Clear OTP and give 15 mins access window
        user.editProfileOtp = undefined;
        user.editProfileOtpExpiry = undefined;
        user.profileEditAccessExpiry = Date.now() + 15 * 60 * 1000; // 15 mins window to edit
        await user.save();

        res.json({ success: true, message: "OTP Verified. Profile unlocked for 15 minutes." });
    } catch (error) {
        console.error("OTP Verify Error:", error);
        res.status(500).json({ success: false, message: "Verification failed." });
    }
});

// 3. Update Profile & Wallet (SECURED)
// Bina auth token ke ab update nahi hoga
router.put('/update-profile-secure', authMiddleware, async (req, res) => {
    try {
        const { name, mobile, email, newWalletAddress } = req.body; // userId removed from here
        const user = await User.findOne({ userId: req.user.userId }); // 🔥 Secure

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Check if user has verified OTP recently (within 15 mins)
        if (!user.profileEditAccessExpiry || user.profileEditAccessExpiry < Date.now()) {
            // Security measure: agar try kiya aur fail hua, access deny.
            return res.status(403).json({ success: false, message: "Session expired or unauthorized. Please verify OTP first." });
        }

        // 🔥 Email Change Logic
        if (email && email.trim() !== '' && email !== user.email) {
            const emailExists = await User.findOne({ email: email.trim() });
            if (emailExists) {
                return res.status(400).json({ success: false, message: "This email is already used by another account." });
            }
            user.email = email.trim(); 
        }

        // Basic Profile Update
        user.name = name || user.name;
        user.mobile = mobile || user.mobile;

        // 🔥 Safe checks ke saath Wallet Logic
        const currentWallet = user.walletAddress || ""; 
        const newWallet = newWalletAddress ? newWalletAddress.trim() : "";

        if (newWallet !== "" && newWallet !== currentWallet) {
            const currentCount = user.walletAddressChangeCount || 0;
            if (currentCount >= 3) {
                return res.status(400).json({ success: false, message: "Wallet address change limit (3 times) exceeded." });
            }

           if (currentWallet !== '') {
                if (!user.walletAddressHistory) {
                    user.walletAddressHistory = [];
                }
                user.walletAddressHistory.push({ 
                    address: currentWallet, 
                    changedAt: new Date(),
                    updatedBy: "User" // 🔥 NAYI LINE
                });
            }

            user.walletAddress = newWallet;
            user.walletAddressChangeCount = currentCount + 1; 
            
            if (user.walletAddressChangeCount === 1) {
                user.walletAddressChangeWindowStart = new Date();
            }
        }

        // 🔒 SEVERE SECURITY: Lock profile instantly after ONE successful update to prevent multi-updates
        user.profileEditAccessExpiry = undefined;
        
        await user.save();

        res.json({ success: true, message: "Profile updated successfully!", user });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ success: false, message: "Profile update failed. Check backend console." });
    }
});
  // ---------------------------
// 1. UPDATED: Direct Team Route
// ---------------------------
// ---------------------------
// 1. UPDATED (SUPER FAST): Direct Team Route
// ---------------------------
router.get('/direct-team/:userId', async (req, res) => {
  try {
    const currentUserId = Number(req.params.userId);

    // 🔥 1. Ek hi baar me saare users RAM mein load karenge (Superfast Breakaway ke liye)
    const allUsers = await User.find({}, 'userId sponsorId name mobile country topUpAmount createdAt role').lean();

    // 👑 🔥 NAYA FIX: CURRENT USER KA ROLE CHECK KARO (Super Leader Bypass ke liye)
    const currentUserData = allUsers.find(u => u.userId === currentUserId);
    const isSuperLeader = currentUserData && currentUserData.role === 'superleader';

    // 2. RAM mein Network Tree (Map) banayenge
    const directMap = new Map();
    const userDetailsMap = new Map();

    for (let u of allUsers) {
        userDetailsMap.set(u.userId, u);
        if (u.sponsorId) {
            if (!directMap.has(u.sponsorId)) {
                directMap.set(u.sponsorId, []);
            }
            directMap.get(u.sponsorId).push(u);
        }
    }

    // 🔥 3. MAIN USER KI TOTAL TEAM NIKALNA (With Breakaway Rule) 🔥
    let mainUserTotalTeam = 0;
    let mainQueue = [...(directMap.get(currentUserId) || [])];

    while (mainQueue.length > 0) {
        const currentNode = mainQueue.shift();
        mainUserTotalTeam++; // Ek user count ho gaya

        // 🛑 ABSOLUTE BREAKAWAY WALL (WITH SUPER LEADER BYPASS) 🛑
        // Agar banda 'leader' hai aur check karne wala 'superleader' NAHI hai, tabhi roko.
        if (currentNode.role === 'leader' && !isSuperLeader) {
            continue; 
        }

        // Agar leader nahi hai ya Super Leader bypass hai, toh iski team aage queue mein add karo
        const children = directMap.get(currentNode.userId) || [];
        for (let child of children) {
            mainQueue.push(child);
        }
    }

    // 🔥 4. TABLE KE LIYE DIRECTS KA DATA BANANA 🔥
    const myDirects = directMap.get(currentUserId) || [];
    
    const teamWithStats = myDirects.map((direct, index) => {
        const membersDirects = directMap.get(direct.userId) || [];
        const directCount = membersDirects.length;

        let teamSize = 0;

        // 🛑 Agar Direct member Leader hai aur user normal hai, toh uski team 0 bhejenge
        if (direct.role === 'leader' && !isSuperLeader) {
            teamSize = 0; 
        } else {
            // Agar bypass allowed hai, toh uski team size calculate karenge
            let subQueue = [...membersDirects];
            while (subQueue.length > 0) {
                const subNode = subQueue.shift();
                teamSize++;

                // 🛑 Is sub-team ke andar bhi Breakaway check karenge (WITH BYPASS)
                if (subNode.role === 'leader' && !isSuperLeader) {
                    continue; 
                }
                const subChildren = directMap.get(subNode.userId) || [];
                for (let child of subChildren) {
                    subQueue.push(child);
                }
            }
        }

        return {
            srNo: index + 1,
            userId: direct.userId,
            name: direct.name,
            mobile: direct.mobile,
            country: direct.country,
            role: direct.role, 
            topUpAmount: direct.topUpAmount,
            createdAt: direct.createdAt,
            totalDirects: directCount,
            totalTeam: teamSize,
            // 🔥 NAYA FIX: Frontend ko same naam se data bhejo jo database mein hai
            globalTeamCount: teamSize, 
            directCount: directCount
        };
    });

    // Naye directs sabse upar dikhane ke liye sort (Descending order of date)
    teamWithStats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Response Bhejenge
    res.json({
      team: teamWithStats,      
      totalTeam: mainUserTotalTeam 
    });

  } catch (err) {
    console.error("Error in direct-team API:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------
// 2. All Team (No Change Needed, but kept for reference)
// ---------------------------
// ---------------------------
// 2. All Team (HIGHLY OPTIMIZED WITH GRAPH LOOKUP)
// ---------------------------
 

// ---------------------------
// 2. All Team (No Change Needed, but kept for reference)
// ---------------------------
// ---------------------------
// 2. All Team (HIGHLY OPTIMIZED WITH GRAPH LOOKUP)
// ---------------------------
// router.get('/all-team/:userId', async (req, res) => {
//   try {
//     const currentUserId = Number(req.params.userId);

//     // 🔥 1. Ek hi baar me saare users RAM mein load karenge (Superfast + Role Checking)
//     const allUsers = await User.find({}, '_id userId sponsorId name country topUpAmount createdAt role').lean();

//     // 2. RAM mein Network Tree banayenge
//     const directMap = new Map();
//     for (let u of allUsers) {
//         if (u.sponsorId) {
//             if (!directMap.has(u.sponsorId)) {
//                 directMap.set(u.sponsorId, []);
//             }
//             directMap.get(u.sponsorId).push(u);
//         }
//     }

//     // 3. Traversal with SECRET BREAKAWAY
//     let allTeam = [];
//     let queue = [];
    
//     // Stats maintain karne ke variables (Aapke purane code ke hisaab se)
//     let directCount = 0;
//     const levelWiseCount = {};

//     // Pehle apne direct (Level 1) walo ko queue mein daalo
//     const directs = directMap.get(currentUserId) || [];
//     for (let d of directs) {
//         queue.push({ user: d, level: 1 });
//     }

//     // Ab poora network traverse karenge
//     while (queue.length > 0) {
//         const { user, level } = queue.shift();

//         // Stats update karo
//         if (level === 1) directCount++;
//         levelWiseCount[level] = (levelWiseCount[level] || 0) + 1;

//         // User ko All Team list mein add kar do
//         allTeam.push({
//             srNo: allTeam.length + 1,
//             _id: user._id,
//             userId: user.userId,
//             name: user.name,
//             country: user.country,
//             topUpAmount: user.topUpAmount || 0,
//             createdAt: user.createdAt,
//             level: level
//             // Role ko hum response mein bhej hi nahi rahe, taaki frontend par kisi ko doubt na ho!
//         });

//         // 🛑 SECRET BREAKAWAY WALL 🛑
//         // Agar ye current banda 'leader' hai, toh network aage badhna band ho jayega.
//         // Iska matlab uske neeche ke Level 2, Level 3 wale log check hi nahi honge!
//         if (user.role === 'leader') {
//             continue; 
//         }

//         // Agar leader nahi hai, toh uske direct logo ko queue mein dalo (Next Level ke liye)
//         const children = directMap.get(user.userId) || [];
//         for (let child of children) {
//             queue.push({ user: child, level: level + 1 });
//         }
//     }

//     // 4. Response exactly aapke purane format me bhej rahe hain
//     res.json({
//       team: allTeam,
//       totalTeamCount: allTeam.length,
//       directCount: directCount,
//       indirectCount: allTeam.length - directCount,
//       levelWiseCount: levelWiseCount
//     });

//   } catch (err) {
//     console.error('Error fetching team:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

router.get('/all-team/:userId', async (req, res) => {
  try {
    const currentUserId = Number(req.params.userId);

    // 🔥 1. Ek hi baar me saare users RAM mein load karenge (Superfast + Role Checking)
    const allUsers = await User.find({}, '_id userId sponsorId name country topUpAmount createdAt role').lean();

    // 🔥 CURRENT USER KA ROLE CHECK KARO (Check if he is a Super Leader)
    const currentUserData = allUsers.find(u => u.userId === currentUserId);
    const isSuperLeader = currentUserData && currentUserData.role === 'superleader';

    // 2. RAM mein Network Tree banayenge
    const directMap = new Map();
    for (let u of allUsers) {
        if (u.sponsorId) {
            if (!directMap.has(u.sponsorId)) {
                directMap.set(u.sponsorId, []);
            }
            directMap.get(u.sponsorId).push(u);
        }
    }

    // 3. Traversal with SECRET BREAKAWAY
    let allTeam = [];
    let queue = [];
    
    // Stats maintain karne ke variables (Aapke purane code ke hisaab se)
    let directCount = 0;
    const levelWiseCount = {};

    // Pehle apne direct (Level 1) walo ko queue mein daalo
    const directs = directMap.get(currentUserId) || [];
    for (let d of directs) {
        queue.push({ user: d, level: 1 });
    }

    // Ab poora network traverse karenge
    while (queue.length > 0) {
        const { user, level } = queue.shift();

        // Stats update karo
        if (level === 1) directCount++;
        levelWiseCount[level] = (levelWiseCount[level] || 0) + 1;

        // User ko All Team list mein add kar do
        allTeam.push({
            srNo: allTeam.length + 1,
            _id: user._id,
            userId: user.userId,
            name: user.name,
            country: user.country,
            topUpAmount: user.topUpAmount || 0,
            createdAt: user.createdAt,
            level: level
            // Role ko hum response mein bhej hi nahi rahe, taaki frontend par kisi ko doubt na ho!
        });

        // 🛑 SECRET BREAKAWAY WALL (WITH SUPER LEADER BYPASS) 🛑
        // Agar ye current banda 'leader' hai, aur jo dekh raha hai wo 'superleader' NAHI hai, toh aage mat badho.
        if (user.role === 'leader' && !isSuperLeader) {
            continue; 
        }

        // Agar leader nahi hai (ya phir dekhne wala superleader hai), toh uske direct logo ko queue mein dalo
        const children = directMap.get(user.userId) || [];
        for (let child of children) {
            queue.push({ user: child, level: level + 1 });
        }
    }

    // 4. Response exactly aapke purane format me bhej rahe hain
    res.json({
      team: allTeam,
      totalTeamCount: allTeam.length,
      directCount: directCount,
      indirectCount: allTeam.length - directCount,
      levelWiseCount: levelWiseCount
    });

  } catch (err) {
    console.error('Error fetching team:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




// ---------------------------
// Wallet History
router.get('/wallet-history/:userId', async (req, res) => {
  try {
    const txs = await Transaction.find({
      userId: Number(req.params.userId),
      type: { $in: ['topup', 'deposit', 'transfer'] }
    }).sort({ date: -1 });

    res.json({ history: txs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

 // Block/Unblock Users
 
// ---------------------------
// All Users

// ---------------------------
  // ---------------------------
// All Users
 
// GET USER POOL STATUS
// GET USER POOL STATUS (Formatted for Frontend)
// GET USER POOL STATUS
router.get('/pool-status/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).select('activePools').lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // 🔥 Sirf wahi pools dikhayenge jo sach me ACTIVE hain aur jinka paisa milna chalu ho gaya hai
    const formattedPools = (user.activePools || [])
      .filter(pool => pool.status === 'ACTIVE' || Number(pool.daysPaid) > 0) 
      .map((pool, index) => {
        return {
          level: pool.level || (index + 1),
          status: (pool.status || 'ACTIVE').toUpperCase(),
          daysPaid: Number(pool.daysPaid) || 0,
          totalDays: Number(pool.totalDays) || 100,
          dailyAmount: Number(pool.dailyAmount) || 0
        };
      });

    res.json({ success: true, activePools: formattedPools });
  } catch (error) {
    console.error("Pool Status Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ PROMO USER DEDICATED ROUTE

// 🔥 ADMIN ROUTE: Purane Missed Rewards Dilane Ke Liye (Bas Ek Baar Chalana Hai)
router.get('/fix-missed-rewards', async (req, res) => {
    try {
        console.log("Fixing missed rewards started...");
        // Un sabhi users ko nikalenge jinka topup 30 ya usse zyada hai
        const eligibleUsers = await User.find({ topUpAmount: { $gte: 30 } });
        let count = 0;

        for (let user of eligibleUsers) {
            // Ye function automatically check karega aur agar condition puri hogi toh reward de dega
            await checkAndAwardManagerReward(user.userId);
            count++;
        }

        console.log(`✅ Missed rewards distribution complete for ${count} users.`);
        res.json({ 
            success: true, 
            message: `Done! Checked ${count} users and distributed all missing rewards.` 
        });
    } catch (err) {
        console.error("Error fixing rewards:", err);
        res.status(500).json({ message: "Server error" });
    }
});




// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\user.js (Ya jahan aapki user APIs hain)
// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\user.js

 
 const { getMonthlyLegStats } = require('../cron/monthlyRewardCron');

// 🔥 Target 8 hata diya, sirf Target 7 tak rakha hai
const REWARD_MILESTONES = [
  { target: 50, strongLeg: 25, otherLegs: 25, reward: 30, title: "Target 1" },
  { target: 250, strongLeg: 125, otherLegs: 125, reward: 100, title: "Target 2" },
  { target: 750, strongLeg: 375, otherLegs: 375, reward: 200, title: "Target 3" },
  { target: 1750, strongLeg: 875, otherLegs: 875, reward: 300, title: "Target 4" },
  { target: 3750, strongLeg: 1875, otherLegs: 1875, reward: 500, title: "Target 5" },
  { target: 6750, strongLeg: 3375, otherLegs: 3375, reward: 1000, title: "Target 6" },
  { target: 11750, strongLeg: 5875, otherLegs: 5875, reward: 1500, title: "Target 7" }
];

// 🔥 SPEED FIX: Simple In-Memory Cache
const rewardCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; 

router.get('/monthly-reward-stats/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId); 
        
        // 🚀 CACHE CHECK
        if (rewardCache.has(userId)) {
            const cached = rewardCache.get(userId);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return res.json(cached.data);
            } else {
                rewardCache.delete(userId); 
            }
        }

        // 👑 🔥 FIX 1: Current User ka role check karo
        const currentUser = await User.findOne({ userId: userId }).select('role').lean();
        const isSuperLeader = currentUser && currentUser.role === 'superleader';

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 👑 🔥 FIX 2: isSuperLeader flag ko function me bhejo!
        const legStats = await getMonthlyLegStats(userId, startOfMonth, endOfMonth, isSuperLeader);
        
        // Find current and next target
        let achievedTargets = [];
        let nextTarget = REWARD_MILESTONES[0];

        for (let milestone of REWARD_MILESTONES) {
            if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
                achievedTargets.push(milestone);
            } else {
                nextTarget = milestone;
                break;
            }
        }

        // Response Data
        const responseData = {
            success: true,
            strongLeg: legStats.strongLeg,
            otherLegs: legStats.otherLegs,
            strongLegId: legStats.strongLegId,     
            strongLegName: legStats.strongLegName, 
            milestones: REWARD_MILESTONES,
            nextTarget: nextTarget
        };

        // 🚀 CACHE SAVE
        rewardCache.set(userId, {
            data: responseData,
            timestamp: Date.now()
        });

        res.json(responseData);

    } catch (error) {
        console.error("Reward Stats Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch reward stats." });
    }
});
   
// =======================================================
// 🔥 NEW $30 GLOBAL AUTO-POOL TOP-UP ROUTE 🔥
// =======================================================


// router.put(
//   '/topup/:userId',
//   authMiddleware, 
//   async (req, res) => {
//     try {
//       const targetUserId = Number(req.params.userId);
//       const { amount, transactionPassword, isPromoFree } = req.body;

//       // 🔹 1. User & Password Check 
//       const currentUser = await User.findOne({ userId: req.user.userId }).lean();
//       if (!currentUser) return res.status(404).json({ message: "Current user not found" });

//       if (!transactionPassword) return res.status(400).json({ message: "Transaction password is required" });
      
//       if (transactionPassword.toLowerCase() !== currentUser.transactionPassword.toLowerCase()) {
//          return res.status(403).json({ message: "Invalid transaction password" });
//       }

//       if (!amount) return res.status(400).json({ message: 'Missing amount.' });

//       // 🔥 REAL vs FAKE USER CHECK
//       let targetUser = await User.findOne({ userId: targetUserId });
//       let isFakeUser = false;
//       let FakeUser;

//       if (!targetUser) {
//           FakeUser = require('../models/FakeUser');
//           targetUser = await FakeUser.findOne({ userId: targetUserId });
//           if (targetUser) {
//               isFakeUser = true; 
//           } else {
//               return res.status(404).json({ message: 'Target user not found' });
//           }
//       }

//       // 🚫 DOUBLE TOP-UP RESTRICTION 
//       if (!isFakeUser) {
//           const isAlreadyBought = targetUser.packages?.some(p => p.amount === amount);
//           if (isAlreadyBought) {
//               return res.status(400).json({ message: `❌ This ID is already active with a $${amount} package. Double top-up is not allowed.` });
//           }
//       } else {
//           if (targetUser.topUpAmount === amount) {
//               return res.status(400).json({ message: `❌ This ID is already active with a $${amount} package. Double top-up is not allowed.` });
//           }
//       }

//       // 🔥 DOWNLINE & SELF CHECK ONLY (Optimized depth to 50 for speed)
//       if (!isFakeUser && currentUser.userId !== targetUserId && currentUser.role !== 'admin') {
//           let isDownline = false;
//           let currentTraceId = targetUser.sponsorId;
//           let depthLimit = 50; 

//           while (currentTraceId && depthLimit > 0) {
//               if (currentTraceId === currentUser.userId) {
//                   isDownline = true; 
//                   break;
//               }
//               const upline = await User.findOne({ userId: currentTraceId }).select('sponsorId').lean();
//               currentTraceId = upline ? upline.sponsorId : null;
//               depthLimit--;
//           }

//           if (!isDownline) {
//               return res.status(403).json({ message: 'Access Denied: You can only activate your own node or your downline team members.' });
//           }
//       }

//       const isPromo = currentUser.role === 'promo';

//       // 🔹 2. Wallet Check & Deduction
//       if (!(isPromoFree && amount === 10) && !isPromo) {
//         if (currentUser.walletBalance < amount) {
//           return res.status(400).json({ message: 'Insufficient balance in wallet' });
//         }
//         await User.updateOne({ userId: currentUser.userId }, { $inc: { walletBalance: -amount } });
//       }

//       const createTransaction = async (data) => {
//          const Transaction = require('../models/Transaction'); 
//          return Transaction.create({ ...data, date: new Date() });
//       };

//       // 🔥 FAKE USER TOP-UP (Show Success, Bypass MLM)
//       if (isFakeUser) {
//           await createTransaction({
//             userId: targetUser.userId,
//             type: "topup",
//             amount,
//             fromUserId: currentUser.userId,
//             toUserId: targetUser.userId,
//             description: `Node Activated with $${amount}`,
//             status: 'success'
//           });

//           await FakeUser.updateOne(
//              { userId: targetUser.userId }, 
//              { $set: { isToppedUp: true, topUpAmount: Math.max(targetUser.topUpAmount || 0, amount), updatedAt: new Date() } }
//           );

//           return res.json({ success: true, message: `Top-up successful! $${amount} Node Activated.` });
//       }

//       // =======================================================
//       // 🔹 3. CORE UPDATE & INSTANT RESPONSE (MAGIC SPEED)
//       // =======================================================
//       let isFirstTopup = !targetUser.isToppedUp;
      
//       if (!targetUser.packages) targetUser.packages = [];
//       targetUser.packages.push({ plan: "Global Auto-Pool", amount: amount, startDate: new Date(), withdrawn: 0 });
//       targetUser.topUpAmount = Math.max(targetUser.topUpAmount || 0, amount);
//       targetUser.updatedAt = new Date(); 
//       if (isFirstTopup) {
//           targetUser.isToppedUp = true;
//           targetUser.topUpDate = new Date(); // 🔥 Ye date Monthly cron check karega
//       }
//       await targetUser.save();

//       let txDescription = isFirstTopup ? `Node Activated with $${amount}` : `Node Upgrade with $${amount}`;
//       await createTransaction({
//             userId: targetUser.userId,
//             type: "topup",
//             amount,
//             fromUserId: currentUser.userId,
//             toUserId: targetUser.userId,
//             description: txDescription,
//             status: 'success'
//       });

//       res.json({ success: true, message: `Top-up successful! $${amount} Node Activated.` });


//       // =======================================================
//       // 🔹 4. BACKGROUND MLM ENGINE (Runs behind the scenes)
//       // =======================================================
//       (async () => {
//           try {
//               if (isFirstTopup) {
//                   // 🌟 GLOBAL TEAM COUNT
//                   await processGlobalTeamGrowth(targetUser.userId);

//                   if (targetUser.sponsorId) {
//                       const sponsor = await User.findOne({ userId: targetUser.sponsorId });
                      
//                       // ✅ SPONSOR INCOME (ONLY IF SPONSOR IS ACTIVE/TOPPED-UP)
//                       if (sponsor && sponsor.isToppedUp) {
//                           sponsor.directCount = (sponsor.directCount || 0) + 1;
                          
//                           // DIRECT INCOME (10%)
//                           const DIRECT_PERCENT = 10; 
//                           const directBonusAmount = (amount * DIRECT_PERCENT) / 100; 

//                           sponsor.directIncome = (sponsor.directIncome || 0) + directBonusAmount;
//                           sponsor.totalDirectIncome = (sponsor.totalDirectIncome || 0) + directBonusAmount;
                          
//                           await createTransaction({
//                               userId: sponsor.userId, type: "direct_income", source: "direct",
//                               amount: directBonusAmount, fromUserId: targetUser.userId,
//                               description: `Direct Bonus (10%) from ${targetUser.name}'s Node Activation`, status: 'success'
//                           });

//                           // 🔥 FAST TRACK
//                           if (sponsor.createdAt) {
//                               const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
//                               if ((new Date().getTime() - new Date(sponsor.createdAt).getTime()) <= thirtyDaysInMs) {
//                                   const FastTrack = require('../models/FastTrack');
//                                   await FastTrack.create({
//                                       sponsorId: sponsor.userId, directUserId: targetUser.userId,
//                                       dailyAmount: 1, daysPaid: 0, maxDays: 10, status: 'active'
//                                   }).catch(e => console.log("Fast Track Error", e));
//                               }
//                           }
//                           await sponsor.save();
//                       } else if (sponsor && !sponsor.isToppedUp) {
//                           console.log(`[BLOCKED] Direct Income of $${(amount * 10) / 100} stopped for Sponsor ${sponsor.userId} because ID is Inactive.`);
//                       }
//                   }

//                   // 🌟 UNIFIED 100-LEVEL ENGINE (SUPERLEADER BYPASS SYSTEM)
//                   const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
//                   let currentUplineId = targetUser.sponsorId; 
//                   let currentLevel = 1;
                  
//                   // 🔥 NAYA FLAG: Ye batayega ki breakaway wall hit hui ya nahi
//                   let isBreakawayHit = false;

//                   while (currentUplineId && currentLevel <= 100) {
//                       const upline = await User.findOne({ userId: currentUplineId }).select('userId isToppedUp sponsorId role');
//                       if (!upline) break;

//                       // 🛑 RULE 1: INACTIVE BLOCKER (Agar banda inactive hai, toh seedha skip karo)
//                       if (!upline.isToppedUp) {
//                           console.log(`[BLOCKED] Income stopped for Upline ${upline.userId} at Level ${currentLevel} because ID is Inactive.`);
//                           currentUplineId = upline.sponsorId;
//                           currentLevel++;
//                           continue; 
//                       }

//                       const isCurrentUplineLeader = (upline.role === 'leader');
//                       const isCurrentUplineSuperLeader = (upline.role === 'superleader'); // 🔥 Naya role fetch kiya

//                       // 🛑 BREAKAWAY RULE: Agar Leader aa chuka hai, toh normal user block honge, par SUPERLEADER bypass kar jayega!
//                       if (isBreakawayHit && !isCurrentUplineSuperLeader) {
//                           currentUplineId = upline.sponsorId;
//                           currentLevel++;
//                           continue; // Block Normal User & other Leaders above breakaway
//                       }

//                       // ============================================
//                       // 1. LEVEL INCOME LOGIC (Level 2 se 20 tak)
//                       // ============================================
//                       if (currentLevel >= 2 && currentLevel <= 20) {
//                           const percentage = LEVEL_PERCENTAGES[currentLevel - 1];
//                           const levelAmount = (amount * percentage) / 100;

//                           if (levelAmount > 0) {
//                               await User.updateOne({ _id: upline._id }, { $inc: { levelIncome: levelAmount, totalLevelIncome: levelAmount } });
//                               await createTransaction({
//                                   userId: upline.userId, type: "level_income", source: "level", amount: levelAmount,
//                                   fromUserId: targetUser.userId, description: `Level ${currentLevel} Income (${percentage}%) from ${targetUser.name}'s Activation`, status: 'success'
//                               });
//                           }
//                       }

//                       // ============================================
//                       // 2. INSTANT LEADER 10% LOGIC & BREAKAWAY
//                       // ============================================
//                       // Ye sirf pehle 'leader' ko milega (isBreakawayHit false hone par)
//                       if (currentLevel >= 2 && isCurrentUplineLeader && !isBreakawayHit) {
//                           const instantBonusAmount = (amount * 10) / 100;
                          
//                           await User.updateOne(
//                               { _id: upline._id }, 
//                               { $inc: { walletBalance: instantBonusAmount } }
//                           );
                          
//                           await createTransaction({
//                               userId: upline.userId, type: "credit_to_wallet", source: "instant_leader_bonus", amount: instantBonusAmount,
//                               fromUserId: targetUser.userId, 
//                               description: `10% Instant Leader Bonus from Downline Activation (Level ${currentLevel})`,
//                               status: "success"
//                           });

//                           console.log(`✅ [NORMAL ROUTE -> LEADER BONUS] Paid $${instantBonusAmount} to Leader ${upline.userId}`);

//                           // 🔥 THE ULTIMATE LEADER BREAKAWAY WALL 🔥
//                           console.log(`[MLM ENGINE] Breakaway hit at Leader ${upline.userId} (Level ${currentLevel}). Normal users above are blocked, but Superleaders will bypass.`);
                          
//                           // BREAK nahi karenge ab, bas flag on kar denge!
//                           isBreakawayHit = true; 
//                       }

//                       currentUplineId = upline.sponsorId;
//                       currentLevel++;
//                   }
//               }
//           } catch (bgError) {
//               console.error("Background MLM Engine Error:", bgError);
//           }
//       })();

//     } catch (err) {
//       console.error('Top-up Error:', err);
//       if (!res.headersSent) {
//           res.status(500).json({ message: 'Server error during top-up' });
//       }
//     }
//   }
// );


// // ==========================================
// // 🚀 LEADER SPECIAL: TOPUP ROUTE
// // ==========================================
// router.put(
//   '/leader-topup/:userId',
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const targetUserId = req.params.userId;
//       const { amount, transactionPassword } = req.body;

//       const currentUser = await User.findOne({ userId: req.user.userId });
//       if (!currentUser) return res.status(404).json({ message: "Current user not found" });
      
//       // 🔥 ALLOW BOTH LEADER & SUPERLEADER
//       if (currentUser.role !== 'leader' && currentUser.role !== 'superleader') {
//           return res.status(403).json({ message: "Access denied. Only leaders and superleaders can use this route." });
//       }

//       if (!transactionPassword) return res.status(400).json({ message: "Transaction password is required" });
      
//       const isValidPassword = (transactionPassword.toLowerCase() === currentUser.transactionPassword.toLowerCase());
//       if (!isValidPassword) return res.status(403).json({ message: "Invalid transaction password" });

//       if (!amount) return res.status(400).json({ message: 'Missing amount.' });

//       const targetUser = await User.findOne({ userId: targetUserId });
//       if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

//       if (targetUser.isToppedUp) {
//           return res.status(400).json({ message: "Action Denied! This ID is already activated (Topped Up)." });
//       }

//       const isDirectReferral = Number(targetUser.sponsorId) === Number(currentUser.userId);
//       const isSelfTopup = Number(targetUser.userId) === Number(currentUser.userId);
      
//       let isDownline = false;
//       if (isDirectReferral || isSelfTopup) {
//           isDownline = true;
//       } else {
//           let checkUplineId = targetUser.sponsorId;
//           let depth = 1;
//           while (checkUplineId && depth <= 50) {
//               if (Number(checkUplineId) === Number(currentUser.userId)) {
//                   isDownline = true;
//                   break;
//               }
//               const nextNode = await User.findOne({ userId: checkUplineId }).select('sponsorId');
//               if (!nextNode) break;
//               checkUplineId = nextNode.sponsorId;
//               depth++;
//           }
//       }

//       if (!isDownline) {
//           return res.status(403).json({ 
//               message: "Action Denied! You can only activate IDs in your own Downline. Upline or Crossline top-up is restricted." 
//           });
//       }

//       const isDummyTopup = isDirectReferral || isSelfTopup;
//       let usableBalance = 0;

//       if (isDummyTopup) {
//         usableBalance = currentUser.walletBalance;
//       } else {
//         usableBalance = currentUser.walletBalance - 30;
//       }

//       if (usableBalance < amount) {
//         if (isDummyTopup) {
//             return res.status(400).json({ message: `Insufficient balance! You need at least $${amount} to activate this ID.` });
//         } else {
//             return res.status(400).json({ message: `Insufficient Earned Balance! You cannot use the $30 Leader Balance for indirect downlines. You need more than $${amount} in Your Wallet.` });
//         }
//       }
      
//       if (isDummyTopup) {
//         console.log(`[DUMMY TOPUP] Leader ${currentUser.userId} activated ${targetUser.userId}. Leader balance NOT deducted.`);
//       } else {
//         currentUser.walletBalance -= amount;
//       }
//       await currentUser.save();

//       const createTransaction = async (data) => {
//          const Transaction = require('../models/Transaction'); 
//          return Transaction.create({ ...data, date: new Date() });
//       };

//       let isFirstTopup = !targetUser.isToppedUp;
      
//       if (!targetUser.packages) targetUser.packages = [];
//       targetUser.packages.push({
//         plan: "Global Auto-Pool",
//         amount: amount,
//         startDate: new Date(),
//         withdrawn: 0,
//         isDummy: isDummyTopup 
//       });
//       targetUser.topUpAmount = Math.max(targetUser.topUpAmount || 0, amount);
//       targetUser.updatedAt = new Date();

//       if (isFirstTopup) {
//         targetUser.isToppedUp = true;
//         targetUser.topUpDate = new Date();
//         if (isDummyTopup) {
//             targetUser.isDummyActivated = true; 
//         }
//       }
//       await targetUser.save();

//       let txDescription = isFirstTopup ? `Node Activated with $${amount}` : `Node Upgrade with $${amount}`;
//       await createTransaction({
//         userId: targetUser.userId, type: "topup", amount, fromUserId: currentUser.userId, toUserId: targetUser.userId,
//         description: txDescription, status: 'success'
//       });

//       let successMsg = isDummyTopup 
//           ? `Success! Dummy ID Activated. Incomes sent to dashboard only.` 
//           : `Success! Used $${amount} REAL balance to activate Downline member. Real incomes distributed.`;
          
//       res.json({ success: true, message: successMsg });


//       // =======================================================
//       // 🔹 5. BACKGROUND MLM ENGINE (SUPERLEADER BYPASS SYSTEM)
//       // =======================================================
//       (async () => {
//           try {
//               if (isFirstTopup) {
//                   await processGlobalTeamGrowth(targetUser.userId);

//                   if (targetUser.sponsorId) {
//                       const sponsor = await User.findOne({ userId: targetUser.sponsorId });
//                       if (sponsor) {
//                           sponsor.directCount = (sponsor.directCount || 0) + 1;
//                           const DIRECT_BONUS_PERCENTAGE = 10; 
//                           const directBonusAmount = (amount * DIRECT_BONUS_PERCENTAGE) / 100; 

//                           sponsor.directIncome = (sponsor.directIncome || 0) + directBonusAmount;
//                           sponsor.totalDirectIncome = (sponsor.totalDirectIncome || 0) + directBonusAmount;

//                           await createTransaction({
//                               userId: sponsor.userId, type: "direct_income", source: "direct",
//                               amount: directBonusAmount, fromUserId: targetUser.userId,
//                               description: `Direct Bonus (10%) from ${targetUser.name}'s Node Activation${isDummyTopup ? " (Leader)" : ""}`,
//                               status: 'success'
//                           });

//                           if (!isDummyTopup && sponsor.createdAt) {
//                               const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
//                               if ((new Date().getTime() - new Date(sponsor.createdAt).getTime()) <= thirtyDaysInMs) {
//                                   const FastTrack = require('../models/FastTrack');
//                                   await FastTrack.create({
//                                       sponsorId: sponsor.userId, directUserId: targetUser.userId,
//                                       dailyAmount: 1, daysPaid: 0, maxDays: 10, status: 'active'
//                                   }).catch(e => console.log("Fast Track Error", e));
//                               }
//                           }
//                           await sponsor.save();
//                       }
//                   }

//                   const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
//                   let currentUplineId = targetUser.sponsorId; 
//                   let currentLevel = 1;
                  
//                   // 🔥 NAYA FLAG (Leader Bypass)
//                   let isBreakawayHit = false;

//                   while (currentUplineId && currentLevel <= 100) {
//                       const upline = await User.findOne({ userId: currentUplineId }).select('userId isToppedUp sponsorId role');
//                       if (!upline) break; 

//                       const isCurrentUplineLeader = (upline.role === 'leader');
//                       const isCurrentUplineSuperLeader = (upline.role === 'superleader'); // 🔥 Superleader fetch

//                       // 🛑 BREAKAWAY RULE
//                       if (isBreakawayHit && !isCurrentUplineSuperLeader) {
//                           currentUplineId = upline.sponsorId;
//                           currentLevel++;
//                           continue; 
//                       }

//                       if (currentLevel >= 2 && currentLevel <= 20) {
//                           if (upline.isToppedUp) {
//                               const percentage = LEVEL_PERCENTAGES[currentLevel - 1]; 
//                               const levelAmount = (amount * percentage) / 100;
                              
//                               if (levelAmount > 0) {
//                                   await User.updateOne(
//                                       { _id: upline._id }, 
//                                       { $inc: { levelIncome: levelAmount, totalLevelIncome: levelAmount } }
//                                   );
//                                   await createTransaction({
//                                       userId: upline.userId, type: "level_income", source: "level", amount: levelAmount,
//                                       fromUserId: targetUser.userId, 
//                                       description: `Level ${currentLevel} Income (${percentage}%) from ${targetUser.name}'s Activation${isDummyTopup ? " (Leader)" : ""}`,
//                                       status: 'success'
//                                   });
//                               }
//                           }
//                       }

//                       if (!isDummyTopup && currentLevel >= 2 && isCurrentUplineLeader && !isBreakawayHit) {
//                           const instantBonusAmount = (amount * 10) / 100;
                          
//                           await User.updateOne(
//                               { _id: upline._id }, 
//                               { $inc: { walletBalance: instantBonusAmount } }
//                           );
                          
//                           await createTransaction({
//                               userId: upline.userId, type: "credit_to_wallet", source: "instant_leader_bonus", amount: instantBonusAmount,
//                               fromUserId: targetUser.userId, 
//                               description: `10% Instant Bonus from Downline Activation (Level ${currentLevel})`,
//                               status: "success"
//                           });

//                           // 🔥 BREAKAWAY WALL HIT 🔥
//                           console.log(`[MLM ENGINE] Breakaway hit at Leader ${upline.userId} (Level ${currentLevel}). Superleaders will bypass.`);
//                           isBreakawayHit = true; 
//                       }

//                       currentUplineId = upline.sponsorId;
//                       currentLevel++;
//                   }
//               }
//           } catch (bgError) {
//               console.error("Background MLM Engine Error:", bgError);
//           }
//       })();

//     } catch (err) {
//       console.error('Leader Top-up Error:', err);
//       if (!res.headersSent) {
//           res.status(500).json({ message: 'Server error during leader top-up' });
//       }
//     }
//   }
// );


// ==========================================
// 🚀 NORMAL TOPUP ROUTE
// ==========================================
router.put(
  '/topup/:userId',
  authMiddleware, 
  async (req, res) => {
    try {
      const targetUserId = Number(req.params.userId);
      const { amount, transactionPassword, isPromoFree } = req.body;

      // 🔹 1. User & Password Check 
      const currentUser = await User.findOne({ userId: req.user.userId }).lean();
      if (!currentUser) return res.status(404).json({ message: "Current user not found" });

      if (!transactionPassword) return res.status(400).json({ message: "Transaction password is required" });
      
      if (transactionPassword.toLowerCase() !== currentUser.transactionPassword.toLowerCase()) {
         return res.status(403).json({ message: "Invalid transaction password" });
      }

      if (!amount) return res.status(400).json({ message: 'Missing amount.' });

      // 🔥 REAL vs FAKE USER CHECK
      let targetUser = await User.findOne({ userId: targetUserId });
      let isFakeUser = false;
      let FakeUser;

      if (!targetUser) {
          FakeUser = require('../models/FakeUser');
          targetUser = await FakeUser.findOne({ userId: targetUserId });
          if (targetUser) {
              isFakeUser = true; 
          } else {
              return res.status(404).json({ message: 'Target user not found' });
          }
      }

      // 🚫 DOUBLE TOP-UP RESTRICTION 
      if (!isFakeUser) {
          const isAlreadyBought = targetUser.packages?.some(p => p.amount === amount);
          if (isAlreadyBought) {
              return res.status(400).json({ message: `❌ This ID is already active with a $${amount} package. Double top-up is not allowed.` });
          }
      } else {
          if (targetUser.topUpAmount === amount) {
              return res.status(400).json({ message: `❌ This ID is already active with a $${amount} package. Double top-up is not allowed.` });
          }
      }

      // 🔥 DOWNLINE & SELF CHECK ONLY (Optimized depth to 50 for speed)
      if (!isFakeUser && currentUser.userId !== targetUserId && currentUser.role !== 'admin') {
          let isDownline = false;
          let currentTraceId = targetUser.sponsorId;
          let depthLimit = 50; 

          while (currentTraceId && depthLimit > 0) {
              if (currentTraceId === currentUser.userId) {
                  isDownline = true; 
                  break;
              }
              const upline = await User.findOne({ userId: currentTraceId }).select('sponsorId').lean();
              currentTraceId = upline ? upline.sponsorId : null;
              depthLimit--;
          }

          if (!isDownline) {
              return res.status(403).json({ message: 'Access Denied: You can only activate your own node or your downline team members.' });
          }
      }

      const isPromo = currentUser.role === 'promo';

      // 🔹 2. 50/50 WALLET CHECK & DEDUCTION 🔥 (NEW LOGIC)
      if (!(isPromoFree && amount === 10) && !isPromo) {
        
        let maxWalletDeduction = amount * 0.50; // Max 50% from Top-up wallet
        let actualWalletDeduction = Math.min(currentUser.walletBalance || 0, maxWalletDeduction);
        let actualUsdtDeduction = amount - actualWalletDeduction;

        if ((currentUser.usdtBep20Balance || 0) < actualUsdtDeduction) {
            return res.status(400).json({ 
                message: `Insufficient balance! You need at least $${actualUsdtDeduction} in USDT BEP20 Wallet to activate this ID. (Max 50% can be used from Top-up Wallet).` 
            });
        }

        // Deduct from both wallets
        await User.updateOne(
            { userId: currentUser.userId }, 
            { $inc: { 
                walletBalance: -actualWalletDeduction,
                usdtBep20Balance: -actualUsdtDeduction
            }}
        );
      }

      const createTransaction = async (data) => {
         const Transaction = require('../models/Transaction'); 
         return Transaction.create({ ...data, date: new Date() });
      };

      // 🔥 FAKE USER TOP-UP (Show Success, Bypass MLM)
      if (isFakeUser) {
          await createTransaction({
            userId: targetUser.userId,
            type: "topup",
            amount,
            fromUserId: currentUser.userId,
            toUserId: targetUser.userId,
            description: `Node Activated with $${amount}`,
            status: 'success'
          });

          await FakeUser.updateOne(
             { userId: targetUser.userId }, 
             { $set: { isToppedUp: true, topUpAmount: Math.max(targetUser.topUpAmount || 0, amount), updatedAt: new Date() } }
          );

          return res.json({ success: true, message: `Top-up successful! $${amount} Node Activated.` });
      }

      // =======================================================
      // 🔹 3. CORE UPDATE & INSTANT RESPONSE (MAGIC SPEED)
      // =======================================================
      let isFirstTopup = !targetUser.isToppedUp;
      
      if (!targetUser.packages) targetUser.packages = [];
      targetUser.packages.push({ plan: "Global Auto-Pool", amount: amount, startDate: new Date(), withdrawn: 0 });
      targetUser.topUpAmount = Math.max(targetUser.topUpAmount || 0, amount);
      targetUser.updatedAt = new Date(); 
      if (isFirstTopup) {
          targetUser.isToppedUp = true;
          targetUser.topUpDate = new Date(); // 🔥 Ye date Monthly cron check karega
      }
      await targetUser.save();

      let txDescription = isFirstTopup ? `Node Activated with $${amount}` : `Node Upgrade with $${amount}`;
      await createTransaction({
            userId: targetUser.userId,
            type: "topup",
            amount,
            fromUserId: currentUser.userId,
            toUserId: targetUser.userId,
            description: txDescription,
            status: 'success'
      });

      res.json({ success: true, message: `Top-up successful! $${amount} Node Activated.` });


      // =======================================================
      // 🔹 4. BACKGROUND MLM ENGINE (Runs behind the scenes)
      // =======================================================
      (async () => {
          try {
              if (isFirstTopup) {
                  // 🌟 GLOBAL TEAM COUNT
                  await processGlobalTeamGrowth(targetUser.userId);

                  if (targetUser.sponsorId) {
                      const sponsor = await User.findOne({ userId: targetUser.sponsorId });
                      
                      // ✅ SPONSOR INCOME (ONLY IF SPONSOR IS ACTIVE/TOPPED-UP)
                      if (sponsor && sponsor.isToppedUp) {
                          sponsor.directCount = (sponsor.directCount || 0) + 1;
                          
                          // DIRECT INCOME (10%)
                          const DIRECT_PERCENT = 10; 
                          const directBonusAmount = (amount * DIRECT_PERCENT) / 100; 

                          sponsor.directIncome = (sponsor.directIncome || 0) + directBonusAmount;
                          sponsor.totalDirectIncome = (sponsor.totalDirectIncome || 0) + directBonusAmount;
                          
                          await createTransaction({
                              userId: sponsor.userId, type: "direct_income", source: "direct",
                              amount: directBonusAmount, fromUserId: targetUser.userId,
                              description: `Direct Bonus (10%) from ${targetUser.name}'s Node Activation`, status: 'success'
                          });

                          // 🔥 FAST TRACK
                          if (sponsor.createdAt) {
                              const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                              if ((new Date().getTime() - new Date(sponsor.createdAt).getTime()) <= thirtyDaysInMs) {
                                  const FastTrack = require('../models/FastTrack');
                                  await FastTrack.create({
                                      sponsorId: sponsor.userId, directUserId: targetUser.userId,
                                      dailyAmount: 1, daysPaid: 0, maxDays: 10, status: 'active'
                                  }).catch(e => console.log("Fast Track Error", e));
                              }
                          }
                          await sponsor.save();
                      } else if (sponsor && !sponsor.isToppedUp) {
                          console.log(`[BLOCKED] Direct Income of $${(amount * 10) / 100} stopped for Sponsor ${sponsor.userId} because ID is Inactive.`);
                      }
                  }

                  // 🌟 UNIFIED 100-LEVEL ENGINE (SUPERLEADER BYPASS SYSTEM)
                  const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
                  let currentUplineId = targetUser.sponsorId; 
                  let currentLevel = 1;
                  
                  // 🔥 NAYA FLAG: Ye batayega ki breakaway wall hit hui ya nahi
                  let isBreakawayHit = false;

                  while (currentUplineId && currentLevel <= 100) {
                      const upline = await User.findOne({ userId: currentUplineId }).select('userId isToppedUp sponsorId role');
                      if (!upline) break;

                      // 🛑 RULE 1: INACTIVE BLOCKER (Agar banda inactive hai, toh seedha skip karo)
                      if (!upline.isToppedUp) {
                          console.log(`[BLOCKED] Income stopped for Upline ${upline.userId} at Level ${currentLevel} because ID is Inactive.`);
                          currentUplineId = upline.sponsorId;
                          currentLevel++;
                          continue; 
                      }

                      const isCurrentUplineLeader = (upline.role === 'leader');
                      const isCurrentUplineSuperLeader = (upline.role === 'superleader');

                      // 🛑 BREAKAWAY RULE: Agar Leader aa chuka hai, toh normal user block honge, par SUPERLEADER bypass kar jayega!
                      if (isBreakawayHit && !isCurrentUplineSuperLeader) {
                          currentUplineId = upline.sponsorId;
                          currentLevel++;
                          continue; 
                      }

                      // 1. LEVEL INCOME LOGIC (Level 2 se 20 tak)
                      if (currentLevel >= 2 && currentLevel <= 20) {
                          const percentage = LEVEL_PERCENTAGES[currentLevel - 1];
                          const levelAmount = (amount * percentage) / 100;

                          if (levelAmount > 0) {
                              await User.updateOne({ _id: upline._id }, { $inc: { levelIncome: levelAmount, totalLevelIncome: levelAmount } });
                              await createTransaction({
                                  userId: upline.userId, type: "level_income", source: "level", amount: levelAmount,
                                  fromUserId: targetUser.userId, description: `Level ${currentLevel} Income (${percentage}%) from ${targetUser.name}'s Activation`, status: 'success'
                              });
                          }
                      }

                      // 2. INSTANT LEADER 10% LOGIC & BREAKAWAY 🔥 (NEW: goes to usdtBep20Balance)
                      if (currentLevel >= 2 && isCurrentUplineLeader && !isBreakawayHit) {
                          const instantBonusAmount = (amount * 10) / 100;
                          
                          await User.updateOne(
                              { _id: upline._id }, 
                              { $inc: { usdtBep20Balance: instantBonusAmount } } // 🔥 CREDIT TO USDT BEP20 WALLET
                          );
                          
                          await createTransaction({
                              userId: upline.userId, type: "credit_to_wallet", source: "instant_leader_bonus", amount: instantBonusAmount,
                              fromUserId: targetUser.userId, 
                              description: `10% Instant Leader Bonus from Downline Activation (Level ${currentLevel}) credited to USDT BEP20`,
                              status: "success"
                          });

                          console.log(`✅ [NORMAL ROUTE -> LEADER BONUS] Paid $${instantBonusAmount} to USDT BEP20 of Leader ${upline.userId}`);

                          // 🔥 THE ULTIMATE LEADER BREAKAWAY WALL 🔥
                          console.log(`[MLM ENGINE] Breakaway hit at Leader ${upline.userId} (Level ${currentLevel}). Normal users above are blocked, but Superleaders will bypass.`);
                          isBreakawayHit = true; 
                      }

                      currentUplineId = upline.sponsorId;
                      currentLevel++;
                  }
              }
          } catch (bgError) {
              console.error("Background MLM Engine Error:", bgError);
          }
      })();

    } catch (err) {
      console.error('Top-up Error:', err);
      if (!res.headersSent) {
          res.status(500).json({ message: 'Server error during top-up' });
      }
    }
  }
);



// ==========================================
// 🚀 LEADER SPECIAL: TOPUP ROUTE
// ==========================================
router.put(
  '/leader-topup/:userId',
  authMiddleware,
  async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      const { amount, transactionPassword } = req.body;

      const currentUser = await User.findOne({ userId: req.user.userId });
      if (!currentUser) return res.status(404).json({ message: "Current user not found" });
      
      // 🔥 ALLOW BOTH LEADER & SUPERLEADER
      if (currentUser.role !== 'leader' && currentUser.role !== 'superleader') {
          return res.status(403).json({ message: "Access denied. Only leaders and superleaders can use this route." });
      }

      if (!transactionPassword) return res.status(400).json({ message: "Transaction password is required" });
      
      const isValidPassword = (transactionPassword.toLowerCase() === currentUser.transactionPassword.toLowerCase());
      if (!isValidPassword) return res.status(403).json({ message: "Invalid transaction password" });

      if (!amount) return res.status(400).json({ message: 'Missing amount.' });

      const targetUser = await User.findOne({ userId: targetUserId });
      if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

      if (targetUser.isToppedUp) {
          return res.status(400).json({ message: "Action Denied! This ID is already activated (Topped Up)." });
      }

      const isDirectReferral = Number(targetUser.sponsorId) === Number(currentUser.userId);
      const isSelfTopup = Number(targetUser.userId) === Number(currentUser.userId);
      
      let isDownline = false;
      if (isDirectReferral || isSelfTopup) {
          isDownline = true;
      } else {
          let checkUplineId = targetUser.sponsorId;
          let depth = 1;
          while (checkUplineId && depth <= 50) {
              if (Number(checkUplineId) === Number(currentUser.userId)) {
                  isDownline = true;
                  break;
              }
              const nextNode = await User.findOne({ userId: checkUplineId }).select('sponsorId');
              if (!nextNode) break;
              checkUplineId = nextNode.sponsorId;
              depth++;
          }
      }

      if (!isDownline) {
          return res.status(403).json({ 
              message: "Action Denied! You can only activate IDs in your own Downline. Upline or Crossline top-up is restricted." 
          });
      }

      const isDummyTopup = isDirectReferral || isSelfTopup;

      // 🔹 2. 50/50 WALLET CHECK & DEDUCTION FOR LEADER 🔥 (NEW LOGIC)
      let maxWalletDeduction = amount * 0.50; 
      // Reserve $30 in wallet for real topups
      let usableWallet = isDummyTopup ? (currentUser.walletBalance || 0) : Math.max(0, (currentUser.walletBalance || 0) - 30);
      
      let actualWalletDeduction = Math.min(usableWallet, maxWalletDeduction);
      let actualUsdtDeduction = amount - actualWalletDeduction;

      if ((currentUser.usdtBep20Balance || 0) < actualUsdtDeduction) {
          if (isDummyTopup) {
              return res.status(400).json({ message: `Insufficient balance! You need at least $${actualUsdtDeduction} in USDT BEP20 Wallet to activate this ID.` });
          } else {
              return res.status(400).json({ message: `Insufficient Balance! (Keeping $30 Reserve in Wallet). You need at least $${actualUsdtDeduction} in your USDT BEP20 Wallet.` });
          }
      }
      
      if (isDummyTopup) {
        console.log(`[DUMMY TOPUP] Leader ${currentUser.userId} activated ${targetUser.userId}. Leader balance NOT deducted.`);
      } else {
        currentUser.walletBalance -= actualWalletDeduction;
        currentUser.usdtBep20Balance -= actualUsdtDeduction;
      }
      await currentUser.save();

      const createTransaction = async (data) => {
         const Transaction = require('../models/Transaction'); 
         return Transaction.create({ ...data, date: new Date() });
      };

      let isFirstTopup = !targetUser.isToppedUp;
      
      if (!targetUser.packages) targetUser.packages = [];
      targetUser.packages.push({
        plan: "Global Auto-Pool",
        amount: amount,
        startDate: new Date(),
        withdrawn: 0,
        isDummy: isDummyTopup 
      });
      targetUser.topUpAmount = Math.max(targetUser.topUpAmount || 0, amount);
      targetUser.updatedAt = new Date();

      if (isFirstTopup) {
        targetUser.isToppedUp = true;
        targetUser.topUpDate = new Date();
        if (isDummyTopup) {
            targetUser.isDummyActivated = true; 
        }
      }
      await targetUser.save();

      let txDescription = isFirstTopup ? `Node Activated with $${amount}` : `Node Upgrade with $${amount}`;
      await createTransaction({
        userId: targetUser.userId, type: "topup", amount, fromUserId: currentUser.userId, toUserId: targetUser.userId,
        description: txDescription, status: 'success'
      });

      let successMsg = isDummyTopup 
          ? `Success! Dummy ID Activated. Incomes sent to dashboard only.` 
          : `Success! Used Real + USDT BEP20 balance to activate Downline member. Real incomes distributed.`;
          
      res.json({ success: true, message: successMsg });


      // =======================================================
      // 🔹 5. BACKGROUND MLM ENGINE (SUPERLEADER BYPASS SYSTEM)
      // =======================================================
      (async () => {
          try {
              if (isFirstTopup) {
                  await processGlobalTeamGrowth(targetUser.userId);

                  if (targetUser.sponsorId) {
                      const sponsor = await User.findOne({ userId: targetUser.sponsorId });
                      if (sponsor) {
                          sponsor.directCount = (sponsor.directCount || 0) + 1;
                          const DIRECT_BONUS_PERCENTAGE = 10; 
                          const directBonusAmount = (amount * DIRECT_BONUS_PERCENTAGE) / 100; 

                          sponsor.directIncome = (sponsor.directIncome || 0) + directBonusAmount;
                          sponsor.totalDirectIncome = (sponsor.totalDirectIncome || 0) + directBonusAmount;

                          await createTransaction({
                              userId: sponsor.userId, type: "direct_income", source: "direct",
                              amount: directBonusAmount, fromUserId: targetUser.userId,
                              description: `Direct Bonus (10%) from ${targetUser.name}'s Node Activation${isDummyTopup ? " (Leader)" : ""}`,
                              status: 'success'
                          });

                          if (!isDummyTopup && sponsor.createdAt) {
                              const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                              if ((new Date().getTime() - new Date(sponsor.createdAt).getTime()) <= thirtyDaysInMs) {
                                  const FastTrack = require('../models/FastTrack');
                                  await FastTrack.create({
                                      sponsorId: sponsor.userId, directUserId: targetUser.userId,
                                      dailyAmount: 1, daysPaid: 0, maxDays: 10, status: 'active'
                                  }).catch(e => console.log("Fast Track Error", e));
                              }
                          }
                          await sponsor.save();
                      }
                  }

                  const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
                  let currentUplineId = targetUser.sponsorId; 
                  let currentLevel = 1;
                  
                  // 🔥 NAYA FLAG (Leader Bypass)
                  let isBreakawayHit = false;

                  while (currentUplineId && currentLevel <= 100) {
                      const upline = await User.findOne({ userId: currentUplineId }).select('userId isToppedUp sponsorId role');
                      if (!upline) break; 

                      const isCurrentUplineLeader = (upline.role === 'leader');
                      const isCurrentUplineSuperLeader = (upline.role === 'superleader');

                      // 🛑 BREAKAWAY RULE
                      if (isBreakawayHit && !isCurrentUplineSuperLeader) {
                          currentUplineId = upline.sponsorId;
                          currentLevel++;
                          continue; 
                      }

                      if (currentLevel >= 2 && currentLevel <= 20) {
                          if (upline.isToppedUp) {
                              const percentage = LEVEL_PERCENTAGES[currentLevel - 1]; 
                              const levelAmount = (amount * percentage) / 100;
                              
                              if (levelAmount > 0) {
                                  await User.updateOne(
                                      { _id: upline._id }, 
                                      { $inc: { levelIncome: levelAmount, totalLevelIncome: levelAmount } }
                                  );
                                  await createTransaction({
                                      userId: upline.userId, type: "level_income", source: "level", amount: levelAmount,
                                      fromUserId: targetUser.userId, 
                                      description: `Level ${currentLevel} Income (${percentage}%) from ${targetUser.name}'s Activation${isDummyTopup ? " (Leader)" : ""}`,
                                      status: 'success'
                                  });
                              }
                          }
                      }

                      // 2. INSTANT LEADER 10% LOGIC & BREAKAWAY 🔥 (NEW: goes to usdtBep20Balance)
                      if (!isDummyTopup && currentLevel >= 2 && isCurrentUplineLeader && !isBreakawayHit) {
                          const instantBonusAmount = (amount * 10) / 100;
                          
                          await User.updateOne(
                              { _id: upline._id }, 
                              { $inc: { usdtBep20Balance: instantBonusAmount } } // 🔥 CREDIT TO USDT BEP20 WALLET
                          );
                          
                          await createTransaction({
                              userId: upline.userId, type: "credit_to_wallet", source: "instant_leader_bonus", amount: instantBonusAmount,
                              fromUserId: targetUser.userId, 
                              description: `10% Instant Bonus from Downline Activation (Level ${currentLevel}) credited to USDT BEP20`,
                              status: "success"
                          });

                          // 🔥 BREAKAWAY WALL HIT 🔥
                          console.log(`[MLM ENGINE] Breakaway hit at Leader ${upline.userId} (Level ${currentLevel}). Superleaders will bypass.`);
                          isBreakawayHit = true; 
                      }

                      currentUplineId = upline.sponsorId;
                      currentLevel++;
                  }
              }
          } catch (bgError) {
              console.error("Background MLM Engine Error:", bgError);
          }
      })();

    } catch (err) {
      console.error('Leader Top-up Error:', err);
      if (!res.headersSent) {
          res.status(500).json({ message: 'Server error during leader top-up' });
      }
    }
  }
);



// Backend Route: promo-dummy-topup
// ✅ PROMO DUMMY TOPUP - FIXED & ROBUST
// ✅ UPDATED BACKEND ROUTE (Using DummyTransaction Model)
// 🚀 PROMO USER TOPUP ROUTE (Strictly for Showcase/Screenshot Popup)
// 🚀 PROMO USER TOPUP ROUTE (Strictly for Today's Fake IDs)
router.post('/promo-dummy-topup', authMiddleware, async (req, res) => {
  try {
    const { amount, transactionPassword } = req.body;
    const currentUser = await User.findOne({ userId: req.user.userId });

    // 1. Password Check
    if (!transactionPassword || transactionPassword.toLowerCase() !== currentUser.transactionPassword.toLowerCase()) {
      return res.status(403).json({ message: "Invalid transaction password" });
    }

    // 2. Indian Names List
  const dummyNames = [
    "Yashraj Trivedi", "Zoravar Bhatt", "Aarav Sharma", "Vivaan Verma", "Faizan Ansari",
    "Aditya Singh", "Imran Shaikh", "Arjun Patel", "Krishna Gupta", "Rohan Yadav",
    "Aftab Sayyed", "Rahul Mishra", "Amit Tiwari", "Nadeem Siddiqui", "Vikas Pandey",
    "Sandeep Dubey", "Mohit Choudhary", "Arman Pathan", "Nitin Jha", "Manish Joshi",
    "Deepak Mehta", "Ankit Shah", "Rakesh Agarwal", "Suresh Jain", "Sajid Baig",
    "Prakash Saxena", "Mukesh Srivastava", "Abhishek Chauhan", "Ravindra Thakur", "Pankaj Rathore",
    "Sameer Qureshi", "Dinesh Solanki", "Ashok Parmar", "Rajesh Soni", "Salman Mirza",
    "Sanjay Bansal", "Vivek Goyal", "Harsh Mahajan", "Tarun Arora", "Irfan Momin",
    "Varun Malhotra", "Rajat Khanna", "Gaurav Kapoor", "Naveen Anand", "Yash Bhatia",
    "Sohail Shaikh", "Sahil Ahuja", "Akash Nagpal", "Rituraj Sachdeva", "Shubham Oberoi",
    "Rishi Puri", "Ayaan Khan", "Dev Sehgal", "Ishaan Grover", "Kabir Talwar",
    "Laksh Kalra", "Dhruv Bedi", "Aryan Wadhwa", "Junaid Pathan", "Rudra Gulati",
    "Parth Batra", "Keshav Sethi", "Ujjwal Narang", "Pranav Chaturvedi", "Noman Qureshi",
    "Tushar Bhandari", "Nikhil Upadhyay", "Ayush Tripathi", "Bilal Khan", "Shivam Mishra",
    "Madhav Joshi", "Kartik Shukla", "Danish Khan", "Anurag Pandey", "Rohit Tiwari",
    "Hemant Sharma", "Aamir Shaikh", "Kunal Mehta", "Satyam Dwivedi", "Nawaz Pathan",
    "Alok Srivastava", "Neeraj Dixit", "Faisal Qureshi", "Ajay Kashyap", "Vijay Tyagi",
    "Shadab Ansari", "Uday Rawat", "Piyush Bisht", "Anmol Negi", "Rizwan Siddiqui",
    "Nakul Panwar", "Ritik Bhandari", "Chetan Bora", "Farhan Ansari", "Pradeep Kandpal",
    "Saurabh Karki", "Anand Reddy", "Kiran Rao", "Mahendra Naidu", "Hamza Pathan",
    "Raghav Kulkarni", "Zeeshan Khan", "Atharv Deshmukh", "Mohammad Arif", "Tejas Patil",
    "Furqan Ansari", "Niranjan Hegde", "Shariq Siddiqui", "Omkar Jadhav", "Noman Shaikh",
    "Shreyas Gokhale", "Aadil Pathan", "Prathamesh Sawant", "Sufiyan Qureshi", "Milind Deshpande",
    "Rauf Mirza", "Amol Chavan", "Taufeeq Momin", "Ajinkya Mane", "Yasin Sayyed",
    "Nilesh More", "Shahbaz Baig", "Swapnil Pawar", "Javed Khan", "Datta Salunkhe",
    "Arbaz Ansari", "Sagar Kadam", "Muzammil Shaikh", "Ruturaj Shinde", "Ayan Siddiqui",
    "Ninad Apte", "Rashid Pathan", "Aniruddha Ranade", "Junaid Qureshi", "Atharva Tambe",
    "Asad Mirza", "Shankar Bhat", "Faheem Momin", "Ravi Kulkarni", "Aqeel Sayyed",
    "Sachin Patil", "Nisar Baig", "Pravin Jadhav", "Aamir Khan", "Ganesh Hegde",
    "Shakib Ansari", "Satish Kamath", "Parvaiz Shaikh", "Venkatesh Iyer", "Arsalan Siddiqui",
    "Srinivas Rao", "Sohail Pathan", "Harikrishna Menon", "Mudassir Qureshi", "Arvind Nair",
    "Zubair Mirza", "Madhavan Pillai", "Azeem Momin", "Raghavan Acharya", "Shanawaz Sayyed",
    "Shankar Shenoy", "Fardeen Baig", "Karthik Raman", "Naved Khan", "Saravanan Krishnan",
    "Shariq Ansari", "Vignesh Subramanian", "Tanzeel Shaikh", "Prabhu Rajan", "Yameen Siddiqui",
    "Muthu Sundaram", "Adil Pathan", "Hari Narayanan", "Asif Qureshi", "Bala Subramanian",
    "Riyaz Mirza", "Joseph Dsouza", "Sajjad Momin", "Brian Fernandes", "Anees Sayyed",
    "Kevin Rodrigues", "Naeem Baig", "Melvin Pereira", "Fais Khan", "Joel Gonsalves",
    "Ahtesham Ansari", "Ryan Lobo", "Noman Shaikh", "Bikram Majumdar", "Rauf Siddiqui",
    "Anirban Banerjee", "Faizan Pathan", "Subhajit Chatterjee", "Talha Qureshi", "Souvik Mukherjee",
    "Shahid Mirza", "Arindam Bose", "Ruhan Momin", "Kaushik Dutta", "Aqib Sayyed",
    "Tanmoy Sen", "Salim Baig", "Lakhan Bhadoria", "Bhupendra Tomar", "Jagdish Prajapati",
    "Moinuddin Khan", "Narendra Lodhi", "Mahavir Gurjar", "Kailash Khatik", "Gajendra Dangi",
    "Rameez Akhtar", "Govind Kushwaha", "Mukund Purohit", "Ramlal Meena", "Vishal Rajput",
    "Brijesh Pathak", "Rakesh Khandelwal", "Yogesh Suryavanshi", "Shahrukh Qureshi", "Manoj Vaishnav",
    "Dheeraj Tanwar", "Lokesh Parihar", "Bharat Sisodiya", "Kamal Baghel", "Vinay Raghuvanshi",
    "Prem Chouhan", "Naresh Solanki", "Hemraj Jat", "Mukul Goswami", "Raghunath Mali",
    "Devesh Vyas", "Kishan Bairwa", "Mahesh Dadhich", "Rajendra Sharma", "Ghanshyam Teli",
    "Pawan Kachhwaha", "Dilip Barot", "Hariram Suthar", "Bhanwar Lal Jat", "Chandrakant Mahajan",
    "Pratap Rathod", "Shivraj Chandel", "Damodar Acharya", "Narottam Nayak", "Mahendra Behera",
    "Pradeep Mahapatra", "Ranjit Pradhan", "Subrat Mishra", "Bikash Sahu", "Tapan Nayak",
    "Jayanta Rout", "Basudev Panda", "Arif Hussain", "Shakil Ahmad", "Fahad Ansari",
    "Taufiq Shaikh", "Sarfaraz Khan", "Azeem Qadri", "Nadeem Akhtar", "Aamir Siddiqui",
    "Suhail Khan", "Firoz Alam", "Armaan Farooqui", "Junaid Alam", "Nawab Hussain",
    "Zaki Ansari", "Adnan Farooqui", "Shayan Khan", "Shadab Alam", "Ayaan Farooqui",
    "Rehan Akhtar", "Tanzeem Khan", "Furkan Qureshi", "Aatif Siddiqui", "Rizwan Alam",
    "Sufyan Khan", "Shariq Hussain", "Faheem Akhtar", "Aqdas Ansari", "Noman Farooqui",
    "Shavez Khan", "Sameer Alam", "Mubeen Qureshi", "Aslam Hussain", "Yasir Siddiqui",
    "Shadan Khan", "Zeeshan Alam", "Aariz Ansari", "Ahsan Farooqui", "Saif Khan",
    "Muzammil Alam", "Aadil Siddiqui", "Shan Qureshi", "Arham Khan", "Aatif Alam",
    "Furqan Siddiqui", "Rayan Ansari", "Imteyaz Khan", "Shahnawaz Qureshi", "Parvez Alam",
    "Naseem Akhtar", "Tariq Hussain", "Ritesh Choube", "Karan Rathi", "Shahid Usmani",
    "Mangesh Shirole", "Vikrant Nikam", "Aqeel Ahmed", "Sambhaji Gaikwad", "Nitin Borse",
    "Haroon Rashid", "Prakash Borse", "Aniket Dhumal", "Amanullah Khan", "Sudarshan Kale",
    "Rohit Ingle", "Sajid Usmani", "Dattatray Shirsat", "Madhukar Bhosale", "Nafees Ahmad",
    "Abhay Wankhede", "Shivendra Bundela", "Fahim Akram", "Ganesh Mhatre", "Vilas Thorat",
    "Shoaib Akhtar", "Nandkishor Chikte", "Umesh Dongre", "Rauf Ahmed", "Balkrishna Chitale",
    "Shubham Khairnar", "Naved Parveen", "Ravikant Sonkar", "Chandrashekhar Karande", "Zubair Ahmad",
    "Mohan Tembhurne", "Prashant Meshram", "Ahtesham Ali", "Girish Rane", "Tukaram Koli",
    "Riyazuddin Khan", "Babulal Sen", "Rupesh Netam", "Sakib Usmani", "Jagannath Mahato",
    "Tarachand Bhoi", "Waseem Akram", "Mithilesh Mandal", "Suresh Hazarika", "Junaid Ashraf",
    "Pritam Basumatary", "Keshab Kalita", "Arsalan Ahmed", "Bhaben Gogoi", "Manab Deka",
    "Noman Ashraf", "Dipankar Saikia", "Rituraj Borthakur", "Suhail Parveen", "Tirthankar Debnath",
    "Sanjib Kar", "Faiz Alam", "Prasenjit Debbarma", "Kaushik Tripura", "Shariq Ahmed",
    "Nilotpal Neog", "Utpal Bora", "Yameen Ashraf", "Debojit Nath", "Himadri Talukdar",
    "Arman Usmani", "Rakesh Karmakar", "Subhash Biswas", "Tanzeel Alam", "Bikramjit Deori",
    "Parag Medhi", "Ayaan Rashid", "Goutam Barman", "Sudip Sutradhar", "Mubeen Ahmed",
    "Kunal Lahiri", "Tapan Naskar", "Firoz Parveen", "Arup Bhowmik", "Jaydeep Rakshit",
    "Sufiyan Akram", "Nirmal Deb", "Rajat Malakar", "Asif Usmani", "Debashis Paul",
    "Prabir Shil", "Naseem Alam", "Anupam Saha", "Tapas Adhikary", "Rizwan Ahmed",
    "Biplab Dhar", "Santanu Koley", "Faizan Rashid", "Ujjwal Karfa", "Pranab Maiti",
    "Azeem Ashraf", "Soumen Jana", "Biswaroop De", "Mahipal Shekhawat", "Iqbal Nizami",
    "Devendra Poonia", "Samiullah Faridi", "Jagmohan Beniwal", "Shamim Raza", "Surendra Godara",
    "Aaquib Nadvi", "Hanuman Charan", "Nafees Rizvi", "Balveer Jakhar", "Shariq Warsi",
    "Ratan Bhakar", "Ayan Rizvi", "Khemraj Mirdha", "Furkan Nadvi", "Girdhari Mahla",
    "Rashid Warsi", "Bhanwar Puniya", "Talib Rizvi", "Lalit Saran", "Aasim Faridi",
    "Rohtash Dhaka", "Moin Warsi", "Vijendra Peelwa", "Suhail Rizvi", "Narpat Khichar",
    "Arbaz Nadvi", "Shyoji Ram Sihag", "Azeem Faridi", "Rajveer Dudi", "Faheem Warsi",
    "Mukesh Pachar", "Noman Rizvi", "Omveer Jakasaniya", "Aatif Nadvi", "Kuldeep Legha",
    "Tahir Faridi", "Himmatram Bhamu", "Aqib Warsi", "Dharmpal Burdak", "Javed Rizvi",
    "Brijlal Karwasra", "Aadil Nadvi", "Sumer Poonia", "Shahid Faridi", "Madan Makkasar",
    "Anas Warsi", "Ravindra Takhar", "Yusuf Rizvi", "Bhagirath Matoria", "Saad Nadvi",
    "Gopal Siyag", "Zayan Faridi", "Ramkumar Bhadu", "Naeem Warsi", "Shankar Joon",
    "Huzaifa Rizvi", "Bhanwarlal Bajiya", "Ayaan Nadvi", "Mahendra Saran", "Zubair Faridi",
    "Jagdish Gathala", "Fais Warsi", "Ramlal Kookna", "Sameer Rizvi", "Pukhraj Dular",
    "Arham Nadvi", "Kailash Tetarwal", "Muzammil Faridi", "Gajsingh Bhakar", "Rehan Warsi",
    "Tejpal Dhaka", "Aariz Rizvi", "Vikram Mirdha", "Shadab Nadvi", "Bhupsingh Poonia",
    "Rizwan Faridi", "Narendra Legha", "Danish Warsi", "Harphool Sihag", "Asif Rizvi",
    "Jitendra Godara", "Shan Nadvi", "Moolchand Jakhar", "Ahsan Faridi", "Suresh Beniwal",
    "Faizan Warsi", "Manphool Dudi", "Imran Rizvi", "Rajendra Burdak", "Sufyan Nadvi",
    "Hanuman Mahla", "Arsalan Faridi", "Mukhtyar Pachar", "Shahrukh Warsi", "Girdharilal Bajiya",
    "Fardeen Rizvi", "Omprakash Kookna", "Tanzeel Nadvi", "Bhoopendra Gathala", "Raghunandan Kharol",
    "Vardhan Bisen", "Yatendra Baghel", "Tribhuvan Markam", "Mustafa Hashmi", "Bhairav Kanwar",
    "Kuber Netam", "Dushyant Uikey", "Jeevan Tekam", "Arif Chishti", "Harendra Porte",
    "Bhupat Maravi", "Ramlakhan Dhurve", "Nakul Salam", "Gokul Mandavi", "Vishram Korram",
    "Aamir Noori", "Devcharan Kawasi", "Mithlesh Potai", "Narayan Atram", "Pratap Kumeti",
    "Kailash Nagvanshi", "Mahesh Uke", "Qasim Chishti", "Rajkumar Gedam", "Puran Meshram",
    "Tikaram Markole", "Satyendra Baghmare", "Dinesh Kawde", "Chhotelal Pusam", "Shivprasad Naitam",
    "Sajjad Hashmi", "Gajraj Sidar", "Bhanu Pratap Sonwani", "Ramesh Neti", "Devvrat Kunjam",
    "Harinarayan Dhurwe", "Laxmikant Uikey", "Nandlal Atram", "Bhimsen Kawasi", "Damodar Kumre",
    "Zain Noori", "Shivkumar Potavi", "Premsingh Markam", "Ganesh Poyam", "Ramlal Kunjam",
    "Chandrakant Salam", "Bhaskar Marai", "Dharamlal Uike", "Kishore Pusam", "Ayaan Hashmi",
    "Rafi Chishti", "Shayan Noori", "Faiz Hashmi", "Asrar Chishti", "Talha Noori",
    "Noman Hashmi", "Reyan Chishti", "Sufyan Noori", "Zeeshan Hashmi", "Yameen Chishti",
    "Aqeel Noori", "Junaid Hashmi", "Ruhan Chishti", "Ahsan Noori", "Arham Hashmi",
    "Saif Chishti", "Aatif Noori", "Mubeen Hashmi", "Shadman Chishti", "Naeem Noori",
    "Arsalan Hashmi", "Adil Chishti", "Faizan Noori", "Tanzeel Hashmi", "Furqan Chishti",
    "Shariq Noori", "Aariz Hashmi", "Rizwan Chishti", "Hamza Noori", "Parvez Hashmi",
    "Yusuf Chishti", "Naved Noori", "Azeem Hashmi", "Shahid Chishti", "Sohail Noori",
    "Imteyaz Hashmi", "Aman Chishti", "Waseem Noori", "Fahad Chishti", "Shahrukh Noori",
    "Asif Hashmi", "Rituraj Kapse", "Manvendra Jhala", "Dharamveer Kataria", "Nikhilesh Dongardive",
    "Pradyumn Chandel", "Lokendra Hada", "Yograj Devda", "Shivraj Kachhi", "Bhavesh Dholakia",
    "Anurag Kapse", "Hemraj Baria", "Tushar Vasava", "Chetan Gamit", "Jignesh Rabari",
    "Mahipal Charan", "Devashish Munda", "Rakesh Tanti", "Prabhat Oraon", "Niraj Hansda",
    "Kamal Hojam", "Mubashir Kazmi", "Aadil Naqvi", "Rameez Bukhari", "Arbaz Kazmi",
    "Sarmad Naqvi", "Huzefa Bukhari", "Faheem Kazmi", "Taha Naqvi", "Aarish Bukhari",
    "Moin Kazmi", "Rudransh Katoch", "Nakul Jamwal", "Yashwant Dogra", "Praveen Thapa",
    "Dheerendra Rawal", "Mahesh Paneru", "Rajat Bisht", "Sudarshan Lohani", "Pankaj Fartyal",
    "Vinod Karki", "Shahnawaz Kazmi", "Rehmat Naqvi", "Nabeel Bukhari", "Ayaan Kazmi",
    "Sufiyan Naqvi", "Zayan Bukhari", "Mudassir Kazmi", "Rayyan Naqvi", "Arham Bukhari",
    "Talib Kazmi", "Harshad Zala", "Mukund Vekariya", "Nitin Korat", "Bharat Makwana",
    "Vipul Kathiriya", "Jaydev Savaliya", "Ketan Mangukiya", "Mitesh Donga", "Paresh Sorathiya",
    "Ravindra Vachhani", "Arshed Naqvi", "Ahtesham Bukhari", "Sajjad Kazmi", "Tanzeem Naqvi",
    "Noman Bukhari", "Fardeen Kazmi", "Yameer Naqvi", "Huzaifa Bukhari", "Shayaan Kazmi",
    "Ruhan Naqvi", "Aniket Bhalerao", "Sachindra Gawande", "Rohidas Khobragade", "Mangesh Atram",
    "Prakash Madavi", "Nandkishor Gedam", "Sopan Meshram", "Ganpat Uikey", "Ravikant Pusam",
    "Shivkumar Korram", "Aqdas Bukhari", "Jibran Kazmi", "Sameeh Naqvi", "Ayan Bukhari",
    "Faiyaz Kazmi", "Ariz Naqvi", "Naeem Bukhari", "Rafe Kazmi", "Tameem Naqvi",
    "Zubyan Bukhari", "Dattatray Ingole", "Balkrishna Waghmare", "Gajanan Lande", "Sanjay Kakde",
    "Vilas Nagrale", "Madhukar Kharat", "Pandurang Shingade", "Eknath Dhengre", "Ashok Bopche",
    "Namdeo Wankhade", "Satyajeet Mohite", "Raviraj Nalawade", "Pruthviraj Shirke", "Shailendra Chavan",
    "Abhijit Barge", "Tanmay Jagtap", "Vaibhav Khade", "Nilesh Ghorpade", "Ruturaj Mohol",
    "Sanket Dabhade", "Mujtaba Rizwan", "Shayan Qadri", "Hammad Firdausi", "Armaan Nizari",
    "Zarar Husaini", "Areeb Madani", "Daniyal Faruqi", "Uzair Abbasi", "Sahil Rizvi",
    "Basit Kashmiri", "Pranay Kshirsagar", "Anand Bawane", "Tejendra Bhoyar", "Rameshwar Dhote",
    "Yuvraj Khandekar", "Rohidas Futane", "Sharad Bisenkar", "Mahadev Tidke", "Vikasrao Wagh",
    "Ganeshrao Katre", "Ibrahim Nizami", "Ammar Firdausi", "Mahir Qadri", "Zayan Husaini",
    "Rayan Abbasi", "Shaheer Faruqi", "Afnan Madani", "Taha Rizwan", "Eesa Kashmiri",
    "Zubair Nizari", "Siddhesh Surve", "Akshay Dalvi", "Omraj Palav", "Shubhransh Naik",
    "Nikhil Rautela", "Parag Bhagat", "Mohan Kene", "Vivek Mestri", "Suhas Tandel",
    "Prasad Parab", "Sarmad Abbasi", "Ramees Husaini", "Aariz Faruqi", "Junaid Nizami",
    "Haseeb Qadri", "Arsham Rizwan", "Tameem Firdausi", "Aahil Madani", "Zavian Kashmiri",
    "Jaspreet Dhillon", "Ashutosh Mishra", "Ravi Teja Reddy", "Bhavesh Desai", "Sunil Hembrom",
    "Pradeep Narayanan", "Sukhdeep Grewal", "Rohit Pandey", "Nagarjuna Chowdary", "Kalpesh Trivedi",
    "Ajay Tudu", "Senthil Kumar", "Amritpal Sidhu", "Shivam Tripathi", "Harsha Varma",
    "Mitesh Joshi", "Mahesh Murmu", "Balasubramanian Pillai", "Navjot Randhawa", "Aditya Awasthi",
    "Sai Charan Goud", "Paresh Bhatt", "Dilip Baskey", "Arunachalam Nair", "Parminder Pannu",
    "Satyam Chaubey", "Kiran Kumar Reddy", "Nirav Vyas", "Ramesh Hansda", "Sivakumar Swaminathan",
    "Gagandeep Cheema", "Umesh Pathak", "Raghavendra Yadav", "Jayesh Amin", "Birsa Toppo",
    "Thangaraj Srinivasan", "Kulwinder Sekhon", "Prashant Dixit", "Lokesh Babu", "Chirag Panchal",
    "Anil Kisku", "Ravichandran Mahadevan", "Hardeep Virk", "Abhinav Bajpai", "Madhusudhan Rao",
    "Hemal Modi", "Sanjay Lakra", "Suresh Balan", "Amandeep Toor", "Deepak Tiwari",
    "Krishna Murthy", "Ketan Gandhi", "Vinod Kerketta", "Murugan Rajan", "Rajwinder Mann",
    "Nitesh Shukla", "Manoj Reddy", "Vipul Dave", "Arvind Minz", "Selvaraj Ganesan",
    "Jatinder Chahal", "Akhilesh Upadhyay", "Praveen Naidu", "Hitesh Parekh", "Raju Oraon",
    "Periyasamy Kannan", "Gurpreet Bajwa", "Rajat Srivastava", "Anand Raju", "Nakul Patel",
    "Shankar Tirkey", "Elango Venkataraman", "Sandeep Dhaliwal", "Vikas Pande", "Tarun Chowdhury",
    "Rutvik Solanki", "Mukesh Barla", "Kumaravel Arumugam", "Harjit Bains", "Piyush Tandon",
    "Chandra Sekhar Reddy", "Yash Bhavsar", "Ajit Kujur", "Arulmozhi Natarajan", "Dineshvel Muthukrishnan",
    "Jegadeesh Perumal", "Kumaran Thirumalai", "Madhan Velmurugan", "Prabhakaran Annamalai", "Yuvaraj Chockalingam",
    "Boopathi Palanisamy", "Manikandan Alagappan", "Sathishkumar Dhanapal", "Tejas Bhogayata", "Maulik Kansara",
    "Viral Chokshi", "Ruturaj Vaghasiya", "Krunal Zaveri", "Devang Majmudar", "Nisarg Jani",
    "Parthiv Kothari", "Harit Bhayani", "Meet Sanghvi", "Pavan Kalyan Guntur", "Sandeep Penmetsa",
    "Charan Veeramachaneni", "Lokesh Muppala", "Nikhil Velagapudi", "Tarak Kancherla", "Vamshi Katragadda",
    "Bhargav Pasupuleti", "Rakesh Adusumilli", "Phanindra Yarlagadda", "Jaskaran Chhina", "Lovepreet Deol",
    "Ranjodh Boparai", "Satnam Aulakh", "Gurkirat Samra", "Mandeep Basra", "Dilraj Heer",
    "Harjot Sohal", "Balraj Tiwana", "Inderpal Atwal", "Shubhendu Rastogi", "Naman Saxena",
    "Pratyush Nigam", "Anshul Agarwal", "Devendra Bhadouria", "Raghvendra Gautam", "Pushpendra Tomar",
    "Shailendra Chaubey", "Mayank Katiyar", "Vivekanand Purohit", "Sukhram Kandulna", "Babulal Purty",
    "Prakash Bodra", "Ramesh Pingua", "Nirmal Gagrai", "Ajay Surin", "Mangal Kandir",
    "Lukas Xalxo", "Mahadev Puran", "Doman Soy", "Aravindhan Chelladurai", "Muthuvel Pandiarajan",
    "Sarvesh Vora", "Dhruvin Rabari", "Jagadeesh Bommireddy", "Mahesh Kurella", "Amanpreet Bhullar",
    "Jatinder Sangha", "Pranjal Srivastava", "Ritesh Chitransh", "Karthirajan Somasundaram", "Senthooran Rajasekar",
    "Bhavin Lad", "Yatin Virani", "Sai Prudhvi Nalluri", "Chaitanya Mandava", "Sai Krishna Darsi",
    "Raghvendra Tandon", "Ajit Kujur", "Hemal Borad", "Faheem Ansari", "Subrat Pattnaik",
    "Ankan Ghosh", "Selvarasu Murugan", "Harmeet Sandha", "Rayan Qureshi", "Naveen Velagapudi",
    "Mayur Chaubey", "Roshan Kisku", "Kalpesh Kanani", "Asif Usmani", "Prasanta Lenka",
    "Sourav Mitra", "Velraj Chidambaram", "Rajwinder Johal", "Aadil Khan", "Phani Kalluri",
    "Vivek Srivastava", "Sanjay Baskey", "Yash Virani", "Sameer Akhtar", "Debajyoti Swain",
    "Agnivo Pal", "Karunanidhi Selvaraj", "Gurman Brar", "Fardeen Qureshi", "Praneel Veeramachaneni",
    "Anmol Pandey", "Kailash Xalxo", "Bhavin Makwana", "Rizwan Farooqui", "Prabhat Moharana",
    "Arka Nandi", "Muthuselvan Rajan", "Harjit Pannu", "Aamir Siddiqui", "Sai Karthik Kurella",
    "Rohit Awasthi", "Prakash Soy", "Nirav Ladani", "Shahid Ansari", "Rabin Pradhan", "Sapta"
];

    const randomNameIndex = Math.floor(Math.random() * dummyNames.length);
    const generatedName = dummyNames[randomNameIndex];
    const generatedId = Math.floor(1000000 + Math.random() * 9000000); 

    // 3. FakeUser Table mein add karo (Taaki Global List me dikhe)
    const FakeUser = require('../models/FakeUser');
    await FakeUser.create({
        userId: generatedId,
        name: generatedName,
        package: 30,
        country: "India",
        date: new Date() 
    });

    // =========================================================================
    // 🚀 NEW: GLOBAL TEAM GROWTH LOGIC (Jaise normal topup aur cron me hota hai)
    // =========================================================================
    const activeUsers = await User.find({ isToppedUp: true }).select('_id globalTeamCount directCount');
    const bulkOps = [];

    for (const user of activeUsers) {
        const team = user.globalTeamCount || 0;
        const directs = user.directCount || 0;
        
        let isLocked = false;
        
        // Locking conditions (Same as your cron logic)
        if (team === 2360 && directs < 6) isLocked = true;
        else if (team === 4360 && directs < 8) isLocked = true;
        else if (team === 7360 && directs < 10) isLocked = true;
        else if (team === 11360 && directs < 12) isLocked = true;
        else if (team === 16360 && directs < 14) isLocked = true;
        else if (team === 23860 && directs < 16) isLocked = true;
        else if (team === 33860 && directs < 18) isLocked = true;

        if (!isLocked) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: user._id },
                    update: { $inc: { globalTeamCount: 1 } } // ✅ Sab eligible users ki team 1 se badha di
                }
            });
        }
    }

    if (bulkOps.length > 0) {
        await User.bulkWrite(bulkOps);
    }
    // =========================================================================

    // =========================================================================
    // 🚀 NEW: TOTAL COMMUNITY COUNT UPDATE (SystemStat)
    // Ye dashboard par total users ka count badhayega
    // =========================================================================
    const SystemStat = require('../models/SystemStat');
    await SystemStat.findOneAndUpdate(
        {}, 
        { $inc: { globalFakeCount: 1 } }, // Total community / Fake count ko +1 kar dega
        { upsert: true, returnDocument: 'after' }
    );
    // 4. Record Dummy Transaction (For Admin History)
    const Transaction = require('../models/Transaction'); 
    await Transaction.create({
      userId: generatedId,
      amount: Number(amount),
      type: "promo", 
      fromUserId: currentUser.userId,
      toUserId: generatedId,
      status: "success",
      description: `Promo showcase generated for Fake ID ${generatedId}`,
      date: new Date()
    });

    // 5. Success Response
    res.json({ 
        success: true, 
        generatedId: generatedId, 
        name: generatedName 
    });

  } catch (err) {
    console.error("Promo Showcase Error:", err);
    res.status(500).json({ message: "Server error during promo topup: " + err.message });
  }
});




 // Downline Team Business Details
router.get("/binary-summary/:userId", async (req, res) => {  
  try {
    const user = await User.findOne({ userId: Number(req.params.userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const strong = user.strongLegBusiness || 0;
    const weak   = user.weakLegBusiness || 0;

    const totalMatching = Math.min(strong, weak);
    const carryForward  = Math.abs(strong - weak);

    res.json({
      strongLegBusiness: strong,
      weakLegBusiness: weak,
      totalMatching,
      carryForward,

      // 🔷 current unreleased / available binary
      binaryIncome: user.binaryIncome || 0,

      // 🔥 VERY IMPORTANT FOR UI (eligibility)
      hasWithdrawn100: user.hasWithdrawn100 === true,

      // 🔥 optional (agar future me total released track karna ho)
      totalEarnedSoFar: user.totalBinaryEarned || user.binaryIncome || 0,
    });
  } catch (err) {
    console.error("Binary summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.get('/global-team-count/:userId', async (req, res) => {
  try {
    // System me total users
    const users = await User.find({}, { userId: 1, _id: 0 }).lean();
    const count = users.length;

    res.json({ count });
  } catch (err) {
    console.error('Error fetching global team count:', err);
    res.status(500).json({ message: 'Failed to fetch global team count' });
  }
});





// GET Downline Business
// 🚀 UPDATED (SUPER FAST): Downline Business Route
router.get("/downline-business/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    // 1. Find main user
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Sirf 1 DB call mein saari downline team nikal lo (GraphLookup)
    const teamResult = await User.aggregate([
      { $match: { userId: userId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$userId",
          connectFromField: "userId",
          connectToField: "sponsorId",
          as: "downline",
          maxDepth: 15, // 15 level deep tak ki team fetch karega
          depthField: "level"
        }
      }
    ]);

    // Agar downline nahi hai, toh empty data bhej do
    if (!teamResult || teamResult.length === 0 || !teamResult[0].downline) {
      return res.json({
        totalTopup: 0,
        totalWithdrawal: 0,
        totalBusiness: 0,
        totalTeamCount: 0,
        directCount: 0,
        indirectCount: 0,
        team: []
      });
    }

    const rawTeam = teamResult[0].downline;
    // Saare downline users ki ID ek array mein nikal lo
    const downlineUserIds = rawTeam.map(u => u.userId);

    // 3. Poori team ki transactions sirf 1 DB call mein nikal lo (Yahan loop khatam ho gaya!)
    const allTransactions = await Transaction.find({
      userId: { $in: downlineUserIds },
      type: { $in: ["topup", "withdrawal"] }
    }).lean().sort({ date: -1 });

    // 4. Transactions ko fast processing ke liye Map (Dictionary) mein daal lo
    const txMap = {};
    allTransactions.forEach(t => {
      if (!txMap[t.userId]) txMap[t.userId] = [];
      
      // Amount format fix
      let amt = t.amount;
      if (amt && typeof amt === "object") {
        amt = parseFloat(amt.toString());
      } else {
        amt = Number(amt || 0);
      }

      txMap[t.userId].push({
        type: t.type,
        amount: amt,
        date: t.date
      });
    });

    // 5. Final Calculations
    let totalSystemTopup = 0;
    let totalSystemWithdrawal = 0;
    let totalSystemBusiness = 0;
    let directCount = 0;
    let indirectCount = 0;

    const formattedTeam = rawTeam.map((u, idx) => {
      const actualLevel = (u.level || 0) + 1; // GraphLookup 0 se start karta hai
      
      if (actualLevel === 1) directCount++;
      else indirectCount++;

      const userTxs = txMap[u.userId] || [];
      
      let totalTopup = 0;
      let totalWithdrawal = 0;
      let totalBusiness = 0;

      userTxs.forEach(t => {
        if (t.type === "topup") totalTopup += t.amount;
        if (t.type === "withdrawal") totalWithdrawal += t.amount;
        totalBusiness += t.amount;
      });

      totalSystemTopup += totalTopup;
      totalSystemWithdrawal += totalWithdrawal;
      totalSystemBusiness += totalBusiness;

      return {
        userId: u.userId,
        name: u.name || "N/A",
        level: actualLevel,
        totalTopup,
        totalWithdrawal,
        totalBusiness,
        transactions: userTxs
      };
    });

    // Level ke hisaab se sort karo (Directs pehle aayenge)
    formattedTeam.sort((a, b) => a.level - b.level);

    // Frontend ke hisaab se srNo add karo
    const finalTeam = formattedTeam.map((u, idx) => ({
      srNo: idx + 1,
      ...u
    }));

    // 6. Return response
    res.json({
      totalTopup: totalSystemTopup,
      totalWithdrawal: totalSystemWithdrawal,
      totalBusiness: totalSystemBusiness,
      totalTeamCount: finalTeam.length,
      directCount,
      indirectCount,
      team: finalTeam
    });

  } catch (err) {
    console.error("Error fetching downline business:", err);
    res.status(500).json({ message: "Server error" });
  }
});




// 🔥 ADMIN ROUTE: Purane Missed Rewards Dilane Ke Liye (Bas Ek Baar Chalana Hai)
 


// routes/user.js
// ✅ UPDATED: Sponsor Name Fetch (Dono tables check karega)
router.get('/sponsor-name/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    // 1. Pehle 'User' (Real) collection mein dhoondo
    // Sirf 'name' select kar rahe hain taaki query fast ho
    let sponsor = await User.findOne({ userId: id }).select('name');

    // 2. 🔥 Agar Real mein nahi mila, toh 'FakeUser' table mein check karo
    if (!sponsor) {
      // Ensure karna ki FakeUser model upar require/import kiya hua hai
      if (typeof FakeUser !== 'undefined') {
        sponsor = await FakeUser.findOne({ userId: id }).select('name');
      } else if (typeof DummyUser !== 'undefined') {
        // Fallback agar galti se purana model use ho raha ho
        sponsor = await DummyUser.findOne({ userId: id }).select('name');
      }
    }

    // 3. Agar dono jagah nahi mila toh 404
    if (!sponsor) {
      return res.status(404).json({ message: 'Sponsor not found' });
    }

    // 4. Sirf naam bhej do (Frontend isi ka intezaar kar raha hai)
    res.json({ name: sponsor.name });

  } catch (err) {
    console.error("Sponsor Name Fetch Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ==========================================
// ✅ GET REWARD PROGRESS STATS API
// ==========================================
// ==========================================
// ✅ FAST: GET REWARD PROGRESS STATS API
// ==========================================
router.get('/reward-stats/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = await User.findOne({ userId });
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔥 FASTER WAY: Ek single database call se saari team nikal lo
    const result = await User.aggregate([
      { $match: { userId: userId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$userId",
          connectFromField: "userId",
          connectToField: "sponsorId",
          as: "fullTeam",
          maxDepth: 15,
          depthField: "level" // direct = level 0, indirect = level 1+
        }
      }
    ]);

    let teamSize30 = 0;
    let teamSize60 = 0;
    let teamSize120 = 0;
    let directs = [];

    // Memory (RAM) mein fast counting
    if (result.length > 0 && result[0].fullTeam) {
       const fullTeam = result[0].fullTeam;
       
       for (const member of fullTeam) {
           // Level 0 ka matlab Direct Member hai
           if (member.level === 0) {
               directs.push(member);
           } 
           // Level > 0 ka matlab Downline Team (indirects) hai
           else {
               const amt = member.topUpAmount || 0;
               if (amt >= 30) teamSize30++;
               if (amt >= 60) teamSize60++;
               if (amt >= 120) teamSize120++;
           }
       }
    }

    res.json({
      success: true,
      ownTopUpAmount: user.topUpAmount || 0,
      currentRanks: {
        managerRank: user.managerRank || 0,
        seniorManagerRank: user.seniorManagerRank || 0,
        executiveManagerRank: user.executiveManagerRank || 0
      },
      teamSizes: {
        30: teamSize30,
        60: teamSize60,
        120: teamSize120
      },
      directs: directs.map(d => ({
        topUpAmount: d.topUpAmount || 0,
        managerRank: d.managerRank || 0,
        seniorManagerRank: d.seniorManagerRank || 0,
        executiveManagerRank: d.executiveManagerRank || 0
      }))
    });

  } catch (err) {
    console.error("Reward Stats Error:", err);
    res.status(500).json({ message: "Server error fetching reward stats" });
  }
});
 
// ---------------------------
 

 


// ✅ UPDATED GET ROUTE: Supports both Real and Dummy Users
// Is file ke top par 'bot' import hona chahiye (jahan aapne bot setup kiya hai)
// const { bot } = require('../utils/telegramBot'); 

const mongoose = require('mongoose');
const sanitizeUser = require('../utils/sanitizeUser');

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const rawUserId = req.params.userId;
    const loggedInUserId = Number(req.user.userId);

    // 🛡️ 1. Validation
    if (!rawUserId || rawUserId === "undefined") {
      return res.status(400).json({ success: false, message: 'User ID is missing' });
    }

    let query = {};
    let targetUserId = null;
    
    // 💡 2. Smart Detection
    if (mongoose.Types.ObjectId.isValid(rawUserId) && rawUserId.length === 24) {
      query = { _id: rawUserId };
    } else if (!isNaN(Number(rawUserId))) {
      targetUserId = Number(rawUserId);
      query = { userId: targetUserId };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    // 🔥 SECURITY LOCK: Sirf Admin ya wahi user apna data dekh sake
    if (req.user.role !== 'admin' && targetUserId && targetUserId !== loggedInUserId) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only view your own profile." });
    }

    // 3. Search Real User
    let user = await User.findOne(query).select('-password -transactionPassword -resetToken -__v');
    let isFake = false;
    
    // 🔥 4. Search Fake User if Real not found
    if (!user) {
        const FakeUser = require('../models/FakeUser');
        user = await FakeUser.findOne(query).select('-__v');
        
        if (!user && typeof DummyUser !== 'undefined') {
            user = await DummyUser.findOne(query).select('-__v');
        }

        if (user) {
            isFake = true;
            user = user.toObject ? user.toObject() : user;
            if (user.isToppedUp && (!user.packages || user.packages.length === 0)) {
                user.packages = [{ amount: user.topUpAmount || 30 }];
            }
        }
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 🏆 5. Sync Logic
    if (!isFake && user.totalRewardIncome === 0 && user.rewardIncome > 0) {
        user.totalRewardIncome = user.rewardIncome;
        await user.save();
    }

    // 💰 6. Response
    // res.json({ 
    //     success: true,
    //     user: user, 
    //     income: {
    //         totalDirectIncome: user.totalDirectIncome || user.directIncome || 0,
    //         totalLevelIncome: user.levelIncome || 0,
    //         totalRewardIncome: user.totalRewardIncome || user.rewardIncome || 0,
    //         totalIncome: (user.totalDirectIncome || 0) + (user.levelIncome || 0) + (user.totalRewardIncome || 0)
    //     }
    // });
    // 💰 6. Response
    res.json({ 
        success: true,
        user: user, 
        income: {
            totalDirectIncome: user.totalDirectIncome || user.directIncome || 0,
            
            // 🔥 FIX: Yahan user.totalLevelIncome add kar diya hai
            totalLevelIncome: user.totalLevelIncome || user.levelIncome || 0, 
            
            totalRewardIncome: user.totalRewardIncome || user.rewardIncome || 0,
            
            // 🔥 FIX: Total income mein bhi totalLevelIncome add kar diya
            totalIncome: (user.totalDirectIncome || 0) + (user.totalLevelIncome || user.levelIncome || 0) + (user.totalRewardIncome || 0)
        }
    });

  } catch (err) {
    console.error("Error fetching user profile:", err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ---------------------------
// 2. UPDATE PROFILE ROUTE - 🔥 SECURED
// ---------------------------
router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);
    const loggedInUserId = Number(req.user.userId);

    // 🔥 SECURITY LOCK: Sirf Admin ya wahi user update kar sake
    if (req.user.role !== 'admin' && targetUserId !== loggedInUserId) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only update your own profile." });
    }

    const { walletAddress, oldTxnPassword, name, email, mobile } = req.body;

    const user = await User.findOne({ userId: targetUserId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Transaction Password Verify
    if (!oldTxnPassword || oldTxnPassword !== user.transactionPassword) {
      return res.status(403).json({ message: 'Invalid Transaction Password.' });
    }

    // 🔒 PERMANENT WALLET LOCK & HISTORY LOGIC
    if (walletAddress && walletAddress.trim() !== '') {
      
      // Agar pehle se address hai aur wo change karne ki koshish kar raha hai, toh block karo
      if (user.walletAddress && user.walletAddress.trim() !== '' && walletAddress !== user.walletAddress) {
        return res.status(403).json({ message: 'Wallet Locked: Wallet address cannot be changed once it is set.' });
      }
      
      // Agar address khali tha, toh usko update karne do aur History mein daal do
      if (walletAddress !== user.walletAddress) {
        
        // 🔥 NAYA LOGIC: History array banaiye aur First-time entry daaliye
        if (!user.walletAddressHistory) {
            user.walletAddressHistory = [];
        }
        
        user.walletAddressHistory.push({
            address: walletAddress.trim(), // Jo naya address dala gaya hai
            changedAt: new Date(),
            updatedBy: "User" // 👈 User ne khud set kiya hai, ye track ho gaya
        });

        // Final address database mein save ho raha hai
        user.walletAddress = walletAddress.trim();
        user.walletAddressChangeCount = (user.walletAddressChangeCount || 0) + 1;
        user.walletAddressChangeWindowStart = new Date();
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', user: user });
  } catch (err) {
    console.error('Profile Update Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ---------------------------
// 3. CHECK WALLET
// ---------------------------
router.post('/check-wallet', async (req, res) => {
  const { walletAddress } = req.body;
  const exists = await User.findOne({ walletAddress });
  res.json({ exists: !!exists });
});


// ---------------------------
// 4. PASSWORD CHANGE - 🔥 SECURED WITH authMiddleware
// ---------------------------
router.put('/change-password/:userId', authMiddleware, async (req, res) => {
  const targetUserId = Number(req.params.userId);
  const loggedInUserId = Number(req.user.userId);

  // 🔥 SECURITY LOCK: Sirf apna password badal sakta hai
  if (req.user.role !== 'admin' && targetUserId !== loggedInUserId) {
      return res.status(403).json({ success: false, message: "Unauthorized access." });
  }

  const { oldPassword, newPassword, oldTxnPassword, newTxnPassword } = req.body;
  
  try {
    const user = await User.findOne({ userId: targetUserId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (oldPassword && newPassword) {
      if (oldPassword !== user.password) {
        return res.status(403).json({ message: 'Incorrect old login password' });
      }
      user.password = newPassword; 
    }

    if (oldTxnPassword && newTxnPassword) {
      if (oldTxnPassword !== user.transactionPassword) {
        return res.status(403).json({ message: 'Incorrect old transaction password' });
      }
      user.transactionPassword = newTxnPassword; 
    }

    await user.save();
    res.json({ message: 'Password(s) updated successfully' });

  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
 

// Ye aapki file ki sabse aakhiri line honi chahiye 👇
module.exports = router;