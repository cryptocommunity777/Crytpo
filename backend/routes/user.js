const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
 const TopUp = require('../models/TopUp'); 
 const DummyTransaction = require('../models/DummyTransaction');
const DummyUser = require('../models/DummyUser.js'); // 🔥 Naya model
const { bot } = require('../utils/telegramBot');

 const checkFeature = require("../middleware/checkFeatureEnabled");
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
router.get('/:id', getUserById);
// ---------------------------
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

// ---------------------------
// 1. UPDATED: Direct Team Route
// ---------------------------
// ---------------------------
// 1. UPDATED (SUPER FAST): Direct Team Route
// ---------------------------
router.get('/direct-team/:userId', async (req, res) => {
  try {
    const currentUserId = Number(req.params.userId);

    // 🔥 1. Ek hi Aggregation Query me Directs aur unki Total Team/Directs Count nikal lenge
    // Ye query 1 second se bhi kam me execute hogi
    const result = await User.aggregate([
      // Step A: Find the main user's directs
      { $match: { sponsorId: currentUserId } },
      
      // Step B: Har direct member ki poori downline nikalna (Team Size ke liye)
      {
        $graphLookup: {
          from: "users",
          startWith: "$userId",
          connectFromField: "userId",
          connectToField: "sponsorId",
          as: "fullDownline",
         }
      },

      // Step C: Result ko format karna aur counts banana
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          mobile: 1,
          country: 1,
          topUpAmount: 1,
          createdAt: 1,
          
          // Directs of this member
          totalDirects: {
            $size: {
              $filter: {
                input: "$fullDownline",
                as: "member",
                cond: { $eq: ["$$member.sponsorId", "$userId"] }
              }
            }
          },
          
          // Total Team Size of this member
          totalTeam: { $size: "$fullDownline" }
        }
      },
      // Optional: Naye log upar dikhane ke liye sort
      { $sort: { createdAt: -1 } }
    ]);

    // 🔥 2. Main User (Aapki) Total Team Count Nikalna
    const myTotalTeamResult = await User.aggregate([
      { $match: { userId: currentUserId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$userId",
          connectFromField: "userId",
          connectToField: "sponsorId",
          as: "myDownline"
         }
      },
      { $project: { totalMyTeam: { $size: "$myDownline" } } }
    ]);

    const myTotalTeamCount = myTotalTeamResult.length > 0 ? myTotalTeamResult[0].totalMyTeam : 0;

    // Formatting for frontend
    const teamWithStats = result.map((member, i) => ({
      srNo: i + 1,
      ...member
    }));

    res.json({
      team: teamWithStats,      // Table ka data
      totalTeam: myTotalTeamCount // Upar wale card ke liye data
    });

  } catch (err) {
    console.error("Error in direct-team:", err);
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
router.get('/all-team/:userId', async (req, res) => {
  const userId = Number(req.params.userId);

  try {
    const result = await User.aggregate([
      { $match: { userId: userId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$userId",
          connectFromField: "userId",
          connectToField: "sponsorId",
          as: "downline",
          depthField: "level"
        }
      },
      // 🔥 YEH NAYA STAGE ADD KIYA HAI 🔥
      // Isse 4000+ users ka data 90% halka (lightweight) ho jayega
      {
        $project: {
          "downline._id": 1,
          "downline.userId": 1,
          "downline.name": 1,
          "downline.country": 1,
          "downline.topUpAmount": 1,
          "downline.createdAt": 1,
          "downline.level": 1
        }
      }
    ]);

    if (!result || result.length === 0 || !result[0].downline) {
      return res.json({
        team: [],
        totalTeamCount: 0,
        directCount: 0,
        indirectCount: 0,
        levelWiseCount: {}
      });
    }

    let allTeam = result[0].downline;

    const levelWiseCount = {};
    let directCount = 0;
    
    // Formatting data for frontend
    const formattedTeam = allTeam.map((u, i) => {
      const actualLevel = (u.level || 0) + 1; 
      
      levelWiseCount[actualLevel] = (levelWiseCount[actualLevel] || 0) + 1;
      if (actualLevel === 1) directCount++;

      return {
        srNo: i + 1,
        _id: u._id,
        userId: u.userId,
        name: u.name,
        country: u.country,
        topUpAmount: u.topUpAmount || 0,
        createdAt: u.createdAt,
        level: actualLevel
      };
    });

    res.json({
      team: formattedTeam,
      totalTeamCount: formattedTeam.length,
      directCount: directCount,
      indirectCount: formattedTeam.length - directCount,
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

// ---------------------------
// (Yahan se aapka aage ka code start hoga, jaise Top-up Route wagarah...)

// ---------------------------
// Top-up Route with Daily ROI
// 📌 Top-up API
// 🛑 Top par ye import zaroor karna (agar rewardLogic.js utils folder me banaya hai)
// 🛑 Top par ye import zaroor check kar lena
 
 
// =======================================================
// 🏆 POOL & REWARDS CONFIGURATION (Strong/Other Legs)
// =======================================================
// 🔥 REWARD BONANZA CONFIGURATION (50% Strong Leg : 50% Other Legs) 🔥
// Logic: Target 1 = 50 (25 Strong + 25 Others). Target 2 = 250 (125 Strong + 125 Others) etc.
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

// 🚀 NAYA HELPER: Har ek direct leg ko alag se count karega aur Strong vs Other nikalega
const getLegStats = async (sponsorId) => {
    const directs = await User.find({ sponsorId: sponsorId }, 'userId isToppedUp');
    let legSizes = [];

    for (let direct of directs) {
        let currentLegSize = 0;
        if (direct.isToppedUp) currentLegSize += 1; // Sirf Active IDs

        let queue = [direct.userId];
        while (queue.length > 0) {
            const currentId = queue.shift();
            const downlines = await User.find({ sponsorId: currentId }, 'userId isToppedUp');
            
            for (let d of downlines) {
                if (d.isToppedUp) currentLegSize += 1; // Sirf Active IDs
                queue.push(d.userId);
            }
        }
        legSizes.push(currentLegSize);
    }

    // Legs ko descending order mein sort karo (Sabse badi leg sabse pehle)
    legSizes.sort((a, b) => b - a);

    // Strong Leg = Sabse badi leg. Other Legs = Baaki sab ka Total.
    const strongLegCount = legSizes.length > 0 ? legSizes[0] : 0;
    const otherLegsCount = legSizes.length > 1 ? legSizes.slice(1).reduce((a, b) => a + b, 0) : 0;

    return { 
        strongLeg: strongLegCount, 
        otherLegs: otherLegsCount, 
        total: strongLegCount + otherLegsCount 
    };
};

// =======================================================
// 🔥 NEW $30 GLOBAL AUTO-POOL TOP-UP ROUTE 🔥
// =======================================================
router.put(
  '/topup/:userId',
  authMiddleware, 
  async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      const { amount, transactionPassword, isPromoFree } = req.body;

      // 🔹 1. User & Password Check
      const currentUser = await User.findOne({ userId: req.user.userId });
      if (!currentUser) return res.status(404).json({ message: "Current user not found" });

      if (!transactionPassword) return res.status(400).json({ message: "Transaction password is required" });
      
      const isValidPassword = (transactionPassword.toLowerCase() === currentUser.transactionPassword.toLowerCase());
      if (!isValidPassword) return res.status(403).json({ message: "Invalid transaction password" });

      if (!amount) return res.status(400).json({ message: 'Missing amount.' });

      const targetUser = await User.findOne({ userId: targetUserId });
      if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

      const isPromo = currentUser.role === 'promo';

      // 🔹 2. Wallet Check (Current User ke wallet se paisa katega)
      if (!(isPromoFree && amount === 10) && !isPromo) {
        if (currentUser.walletBalance < amount) {
          return res.status(400).json({ message: 'Insufficient balance in wallet' });
        }
        currentUser.walletBalance -= amount;
        await currentUser.save();
      }

      const createTransaction = async (data) => {
         const Transaction = require('../models/Transaction'); 
         return Transaction.create({ ...data, date: new Date() });
      };

      // =======================================================
      // 🔹 3. 🔥 MAGIC LOGIC: DIRECT, LEVEL & REWARD ENGINE 🔥
      // =======================================================
      let isFirstTopup = false;
      
      if (!targetUser.isToppedUp) {
        isFirstTopup = true;
        targetUser.isToppedUp = true;
        targetUser.topUpDate = new Date();

        // 🌟 SPONSOR DIRECT COUNT & DIRECT INCOME (Level 1)
        if (targetUser.sponsorId) {
            const sponsor = await User.findOne({ userId: targetUser.sponsorId });
            if (sponsor) {
                // 1. Direct Count badhao
                sponsor.directCount = (sponsor.directCount || 0) + 1;
                
                // 2. DIRECT INCOME BHEJO (10% of amount)
                const DIRECT_PERCENT = 10; 
                const directBonusAmount = (amount * DIRECT_PERCENT) / 100; 

                sponsor.directIncome = (sponsor.directIncome || 0) + directBonusAmount;
                sponsor.totalDirectIncome = (sponsor.totalDirectIncome || 0) + directBonusAmount;
 
                // 3. Sponsor ke liye Transaction Log
                await createTransaction({
                    userId: sponsor.userId,
                    type: "direct_income", 
                    source: "direct",
                    amount: directBonusAmount,
                    fromUserId: targetUser.userId,
                    description: `Direct Bonus (10%) from ${targetUser.name}'s Node Activation`,
                    status: 'success'
                });

                // =======================================================
                // 🏆 TEAM REWARD (BONANZA) SYSTEM CHECK (STRONG/OTHER)
                // =======================================================
                const legStats = await getLegStats(sponsor.userId);
                if (!sponsor.claimedRewards) sponsor.claimedRewards = [];

                for (let milestone of REWARD_MILESTONES) {
                    if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
                        if (!sponsor.claimedRewards.includes(milestone.target)) {
                            sponsor.rewardIncome = (sponsor.rewardIncome || 0) + milestone.reward;
                            sponsor.totalRewardIncome = (sponsor.totalRewardIncome || 0) + milestone.reward;
                             sponsor.claimedRewards.push(milestone.target);
                            
                            await createTransaction({
                                userId: sponsor.userId,
                                type: "reward_income", 
                                source: "reward",
                                amount: milestone.reward,
                                description: `Bonanza Reward Unlocked: ${milestone.title}`,
                                status: 'success'
                            });
                        }
                    }
                }
                await sponsor.save();
            }

            // =======================================================
            // 🌟 NEW: 20 LEVEL INCOME ENGINE 🔥
            // =======================================================
            const LEVEL_PERCENTAGES = [
                0,      // Level 1 (Already handled as Direct)
                5,      // Level 2
                3,      // Level 3
                1,      // Level 4
                1,      // Level 5
                0.5, 0.5, 0.5, 0.5, 0.5, // Level 6-10 (0.50% each)
                0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25 // Level 11-20 (0.25% each)
            ];

            let currentUplineId = targetUser.sponsorId; 
            let currentLevel = 1;

            while (currentUplineId && currentLevel <= 20) {
                const upline = await User.findOne({ userId: currentUplineId });
                if (!upline) break;

                // Level 2 se Level 20 tak distribution
                if (currentLevel > 1) {
                    const percentage = LEVEL_PERCENTAGES[currentLevel - 1];
                    const levelAmount = (amount * percentage) / 100;

                    // Condition: Upline active hona chahiye tabhi paisa milega
                    if (levelAmount > 0 && upline.isToppedUp) {
                        upline.levelIncome = (upline.levelIncome || 0) + levelAmount;
                        upline.totalLevelIncome = (upline.totalLevelIncome || 0) + levelAmount;
 
                        await upline.save();

                        await createTransaction({
                            userId: upline.userId,
                            type: "level_income",
                            source: "level",
                            amount: levelAmount,
                            fromUserId: targetUser.userId,
                            description: `Level ${currentLevel} Income (${percentage}%) from ${targetUser.name}'s Activation`,
                            status: 'success'
                        });
                    }
                }

                // Move to next upline
                currentUplineId = upline.sponsorId;
                currentLevel++;
            }
        }
      }

      // =======================================================
      // 🔹 4. Target User Profile Update ($30 Plan)
      // =======================================================
      if (!targetUser.packages) targetUser.packages = [];
      targetUser.packages.push({
        plan: "Global Auto-Pool",
        amount: amount,
        startDate: new Date(),
        withdrawn: 0
      });
      targetUser.topUpAmount = Math.max(targetUser.topUpAmount || 0, amount);
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

      res.json({
        success: true,
        message: `Top-up successful! $${amount} Node Activated.`,
      });

    } catch (err) {
      console.error('Top-up Error:', err);
      res.status(500).json({ message: 'Server error during top-up' });
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

      // 🔹 1. Leader User & Password Check
      const currentUser = await User.findOne({ userId: req.user.userId });
      if (!currentUser) return res.status(404).json({ message: "Current user not found" });
      
      if (currentUser.role !== 'leader') {
          return res.status(403).json({ message: "Access denied. Only leaders can use this route." });
      }

      if (!transactionPassword) return res.status(400).json({ message: "Transaction password is required" });
      
      const isValidPassword = (transactionPassword.toLowerCase() === currentUser.transactionPassword.toLowerCase());
      if (!isValidPassword) return res.status(403).json({ message: "Invalid transaction password" });

      if (!amount) return res.status(400).json({ message: 'Missing amount.' });

      const targetUser = await User.findOne({ userId: targetUserId });
      if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

      // =======================================================
      // 🔹 2. 🔥 SMART WALLET CHECK (Direct/Self = No Deduction) 🔥
      // =======================================================
      // Check karte hain ki target user leader ka apna direct hai ya khud hai
      const isDirectReferral = Number(targetUser.sponsorId) === Number(currentUser.userId);
      const isSelfTopup = Number(targetUser.userId) === Number(currentUser.userId);
      
      let usableBalance = 0;

      if (isDirectReferral || isSelfTopup) {
        // 🟢 DIRECT MEMBER or SELF: Poora balance check hoga (including showcase $30)
        usableBalance = currentUser.walletBalance;
      } else {
        // 🔴 INDIRECT MEMBER: Leader $30 showcase use nahi kar sakta
        usableBalance = currentUser.walletBalance - 30;
      }

      // Balance check
      if (usableBalance < amount) {
        if (isDirectReferral || isSelfTopup) {
            return res.status(400).json({ 
                message: `Insufficient balance! You need at least $${amount} to activate this ID.` 
            });
        } else {
            return res.status(400).json({ 
                message: `Insufficient Earned Balance! You cannot use the Showcase $30 for indirect downlines. You need $${amount} in REAL earnings.` 
            });
        }
      }
      
      // 🔥 MAIN REQUIREMENT: PAISA KATEGA YA NAHI? 🔥
      if (isDirectReferral || isSelfTopup) {
        // Bhai ke rule ke hisaab se: Direct aur Khud ki ID pe BALANCE NAHI KATEGA
        console.log(`[FREE TOPUP] Leader ${currentUser.userId} activated ${targetUser.userId}. Showcase balance NOT deducted.`);
      } else {
        // Agar Indirect member hai, tabhi asli paisa katega
        currentUser.walletBalance -= amount;
      }
      
      await currentUser.save();

      const createTransaction = async (data) => {
         const Transaction = require('../models/Transaction'); 
         return Transaction.create({ ...data, date: new Date() });
      };

      // =======================================================
      // 🔹 3. RESTRICTED REWARD ENGINE & LEVEL INCOME
      // =======================================================
      let isFirstTopup = false;
      
      if (!targetUser.isToppedUp) {
        isFirstTopup = true;
        targetUser.isToppedUp = true;
        targetUser.topUpDate = new Date();

        // Target user ke sponsor ko dhundo (Level 1)
        if (targetUser.sponsorId) {
            const sponsor = await User.findOne({ userId: targetUser.sponsorId });
            if (sponsor) {
                // Direct count hamesha badhega
                sponsor.directCount = (sponsor.directCount || 0) + 1;
                
                // THE LEADER RESTRICTION CHECK (100 Directs Target)
                const isRestrictedLeader = sponsor.role === 'leader' && sponsor.directCount < 100;

                if (!isRestrictedLeader) {
                    // 👉 Restriction NAHI hai: Normal Direct Income Do (Level 1 -> 10%)
                    const DIRECT_BONUS_PERCENTAGE = 10; 
                    const directBonusAmount = (amount * DIRECT_BONUS_PERCENTAGE) / 100; 

                    sponsor.directIncome = (sponsor.directIncome || 0) + directBonusAmount;
                    sponsor.totalDirectIncome = (sponsor.totalDirectIncome || 0) + directBonusAmount;
                    sponsor.walletBalance = (sponsor.walletBalance || 0) + directBonusAmount; 

                    await createTransaction({
                        userId: sponsor.userId,
                        type: "direct_income", 
                        source: "direct",
                        amount: directBonusAmount,
                        fromUserId: targetUser.userId,
                        description: `Direct Bonus (10%) from ${targetUser.name}'s Node Activation`,
                        status: 'success'
                    });

                    // 🏆 TEAM REWARD (BONANZA) - STRONG / OTHER LEGS SYNC
                    const legStats = await getLegStats(sponsor.userId);
                    if (!sponsor.claimedRewards) sponsor.claimedRewards = [];

                    for (let milestone of REWARD_MILESTONES) {
                        if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
                            if (!sponsor.claimedRewards.includes(milestone.target)) {
                                sponsor.rewardIncome = (sponsor.rewardIncome || 0) + milestone.reward;
                                sponsor.totalRewardIncome = (sponsor.totalRewardIncome || 0) + milestone.reward;
                                sponsor.walletBalance = (sponsor.walletBalance || 0) + milestone.reward;
                                sponsor.claimedRewards.push(milestone.target);
                                
                                await createTransaction({
                                    userId: sponsor.userId,
                                    type: "reward_income",
                                    source: "reward",
                                    amount: milestone.reward,
                                    description: `Bonanza Reward Unlocked: ${milestone.title}`,
                                    status: 'success'
                                });
                            }
                        }
                    }
                } else {
                    console.log(`[LEADER RESTRICTED] Sponsor ${sponsor.userId} is a Leader with ${sponsor.directCount} directs. No Income given yet.`);
                }
                
                await sponsor.save();
            }
        }

        // =======================================================
        // 🌟 MAGIC 4: 20 LEVEL INCOME ENGINE 🔥
        // =======================================================
        // Percentages exactly as you requested
        const LEVEL_PERCENTAGES = [
            0,      // Level 1 (10% already distributed as Direct Income)
            5,      // Level 2 -> 5%
            3,      // Level 3 -> 3%
            1,      // Level 4 -> 1%
            1,      // Level 5 -> 1%
            0.5,    // Level 6 -> 0.5%
            0.5,    // Level 7 -> 0.5%
            0.5,    // Level 8 -> 0.5%
            0.5,    // Level 9 -> 0.5%
            0.5,    // Level 10 -> 0.5%
            0.25,   // Level 11 -> 0.25%
            0.25,   // Level 12 -> 0.25%
            0.25,   // Level 13 -> 0.25%
            0.25,   // Level 14 -> 0.25%
            0.25,   // Level 15 -> 0.25%
            0.25,   // Level 16 -> 0.25%
            0.25,   // Level 17 -> 0.25%
            0.25,   // Level 18 -> 0.25%
            0.25,   // Level 19 -> 0.25%
            0.25    // Level 20 -> 0.25%
        ];

        let currentUplineId = targetUser.sponsorId; 
        let currentLevel = 1;

        while (currentUplineId && currentLevel <= 20) {
            const upline = await User.findOne({ userId: currentUplineId });
            if (!upline) break; 

            // Process from Level 2 to 20
            if (currentLevel > 1) {
                const percentage = LEVEL_PERCENTAGES[currentLevel - 1]; 
                const levelAmount = (amount * percentage) / 100;

                // Restriction rule checking for uplines too (jaise direct me tha)
                const isRestrictedLeader = upline.role === 'leader' && (upline.directCount || 0) < 100;

                // Upline active (isToppedUp) hona chahiye aur restricted nahi hona chahiye
                if (levelAmount > 0 && upline.isToppedUp && !isRestrictedLeader) {
                    
                    upline.levelIncome = (upline.levelIncome || 0) + levelAmount;
                    upline.totalLevelIncome = (upline.totalLevelIncome || 0) + levelAmount;
                    upline.walletBalance = (upline.walletBalance || 0) + levelAmount; // Main wallet me add kiya

                    await upline.save();

                    await createTransaction({
                        userId: upline.userId,
                        type: "level_income",
                        source: "level",
                        amount: levelAmount,
                        fromUserId: targetUser.userId,
                        description: `Level ${currentLevel} Income (${percentage}%) from ${targetUser.name}'s Node Activation`,
                        status: 'success'
                    });
                }
            }

            // Agle level par jaane ke liye is upline ka sponsor pakdo
            currentUplineId = upline.sponsorId;
            currentLevel++;
        }
        // ================= END LEVEL INCOME =================
      }

      // =======================================================
      // 🔹 5. Target User Profile Update
      // =======================================================
      if (!targetUser.packages) targetUser.packages = [];
      targetUser.packages.push({
        plan: "Global Auto-Pool",
        amount: amount,
        startDate: new Date(),
        withdrawn: 0
      });
      targetUser.topUpAmount = Math.max(targetUser.topUpAmount || 0, amount);
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

      // 🔥 Dynamic Success Message 🔥
      let successMsg = "";
      if (isDirectReferral) {
          successMsg = `Success! Direct Referral Activated. Showcase balance was NOT deducted.`;
      } else if (isSelfTopup) {
          successMsg = `Success! Self ID Activated. Showcase balance was NOT deducted.`;
      } else {
          successMsg = `Success! Used $${amount} REAL balance to activate indirect member.`;
      }

      res.json({
        success: true,
        message: successMsg,
      });

    } catch (err) {
      console.error('Leader Top-up Error:', err);
      res.status(500).json({ message: 'Server error during leader top-up' });
    }
  }
);


// Backend Route: promo-dummy-topup
// ✅ PROMO DUMMY TOPUP - FIXED & ROBUST
// ✅ UPDATED BACKEND ROUTE (Using DummyTransaction Model)
router.post('/promo-dummy-topup', authMiddleware, async (req, res) => {
  try {
    const { amount, transactionPassword } = req.body;
    const currentUser = await User.findOne({ userId: req.user.userId });

    // 1. Password Check
    if (!transactionPassword || transactionPassword.toLowerCase() !== currentUser.transactionPassword.toLowerCase()) {
      return res.status(403).json({ message: "Invalid transaction password" });
    }

    // 🔥 RANDOM NAME LOGIC: Yahan humne list bana di hai
  const firstNames = [
      "Aarav", "Abhay", "Abhinav", "Aditya", "Adarsh", "Akash", "Akhil", "Alok", "Aman", "Amar", "Amit", "Amol", "Anand", "Aniket", "Anirudh", "Ankit", "Ankur", "Anmol", "Ansh", "Anshul", "Anuj", "Anupam", "Apoorv", "Arjun", "Arnav", "Aryan", "Ashish", "Ashok", "Ashutosh", "Atul", "Ayush",
      "Balram", "Bharat", "Bhaskar", "Bhavish", "Bhupendra", "Brijesh", "Chaitanya", "Chandan", "Chetan", "Chirag", "Daksh", "Darpan", "Deepak", "Dev", "Devendra", "Dharmendra", "Dheeraj", "Dhruv", "Digvijay", "Dilip", "Dinesh", "Divyansh", "Gajendra", "Ganesh", "Gaurav", "Gautam", "Girish", "Gopal", "Gulshan", "Gunjit",
      "Harish", "Harsh", "Harshit", "Hemant", "Himanshu", "Hitesh", "Inder", "Ishaan", "Ishwar", "Jagdish", "Jaideep", "Jatin", "Jitendra", "Jugal", "Kabir", "Kailash", "Kamal", "Kapil", "Karan", "Kartik", "Kaushal", "Ketan", "Kiran", "Kishore", "Krishan", "Krunal", "Kuldeep", "Kunal", "Kushagra", "Laksh", "Lalit", "Lokesh",
      "Madhav", "Mahendra", "Mahesh", "Manas", "Manish", "Manit", "Manoj", "Mayank", "Milind", "Mohit", "Mukesh", "Mukul", "Nakul", "Naman", "Narendra", "Naresh", "Navneet", "Neeraj", "Nikhil", "Nilesh", "Nishant", "Nitin", "Om", "Omprakash", "Pankaj", "Parth", "Pawan", "Pradeep", "Prafull", "Pranjal", "Prateek", "Pratosh", "Praveen", "Prayas", "Puneet", "Pushkar",
      "Raghav", "Rahul", "Rajat", "Rajeev", "Rajesh", "Rajnish", "Rakesh", "Ram", "Ramesh", "Ranveer", "Ratan", "Ravi", "Ravindra", "Rishi", "Ritesh", "Rohan", "Rohit", "Ronak", "Rupesh", "Sachin", "Sagar", "Sahil", "Sajid", "Sameer", "Sandeep", "Sanjay", "Sanjeev", "Santosh", "Sarthak", "Satish", "Saurabh", "Shakti", "Shantanu", "Sharad", "Shashank", "Shikhar", "Shivam", "Shravan", "Shreyas", "Shubham", "Siddharth", "Somesh", "Subhash", "Sudhanshu", "Sudhir", "Sujit", "Sumit", "Sunil", "Suraj", "Suresh", "Surya", "Sushant", "Swapnil",
      "Tanmay", "Tarun", "Tejas", "Trilok", "Tushar", "Uday", "Udit", "Ujjwal", "Umang", "Utkarsh", "Vaibhav", "Varun", "Vicky", "Vidit", "Vijay", "Vikram", "Vimal", "Vinay", "Vineet", "Vinod", "Vipin", "Viplav", "Viraaj", "Vishal", "Vishnu", "Vishwa", "Vivek", "Vyom", "Yash", "Yogesh", "Yuvraj"
    ];

    // 🚀 MEGA LIST: 100+ Indian Last Names
    const lastNames = [
      "Agarwal", "Ahluwalia", "Arora", "Babu", "Bajpai", "Bakshi", "Banerjee", "Bansal", "Bhardwaj", "Bhatia", "Bhatt", "Biswas", "Bose", "Chahal", "Chakraborty", "Chatterjee", "Chauhan", "Chhabra", "Choudhary", "Chopra", "Das", "Dayal", "Deshmukh", "Devi", "Dhillon", "Dixit", "Dubey", "Dutta", "Dwivedi", "Gadhavi", "Gandhi", "Garg", "Gautam", "Gill", "Goel", "Gokhale", "Goswami", "Gowda", "Gupta", "Iyer", "Jadeja", "Jain", "Jha", "Joshi", "Kapoor", "Kashyap", "Kaur", "Khanna", "Khatri", "Kulkarni", "Kumar", "Luthra", "Mahajan", "Malhotra", "Malik", "Maurya", "Mehra", "Mehta", "Menon", "Mishra", "Mittal", "Modi", "Mukherjee", "Nair", "Ojha", "Pandey", "Pant", "Parekh", "Paswan", "Patel", "Patil", "Pillai", "Prasad", "Puri", "Rai", "Rajput", "Rao", "Rastogi", "Rathore", "Rawat", "Reddy", "Sahni", "Saini", "Saksena", "Sarkar", "Saxena", "Sen", "Sethi", "Shah", "Sharma", "Shekhawat", "Shetty", "Shinde", "Shukla", "Singh", "Singhal", "Sinha", "Somani", "Soni", "Srivastava", "Talwar", "Taneja", "Thakur", "Tiwari", "Tripathi", "Trivedi", "Tyagi", "Upadhyay", "Varma", "Vashisht", "Verma", "Vyas", "Yadav"
    ];
    // Randomly pick karne ka tarika
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${randomFirstName} ${randomLastName}`;

    // 2. Unique ID Generation
    let dummyId;
    let isUnique = false;
    while (!isUnique) {
      dummyId = Math.floor(1000000 + Math.random() * 9000000);
      const existsInReal = await User.findOne({ userId: dummyId });
      const existsInDummy = await DummyUser.findOne({ userId: dummyId });
      if (!existsInReal && !existsInDummy) isUnique = true;
    }

    // 3. Save in DUMMY USER table
    const newDummy = new DummyUser({
      userId: dummyId,
      name: fullName, // 🔥 Ab yahan dynamic random naam jayega
      email: `demo_${dummyId}@ cryptocommunity.live`,
      password: "demo_password_123",
      country: "India",
      // 🔥 Mobile bhi random kar diya hai taaki real lage
      mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`, 
      topUpAmount: Number(amount),
      sponsorId: currentUser.userId
    });
    await newDummy.save();

    // 4. Record in Dummy Transaction
    await DummyTransaction.create({
      userId: currentUser.userId,
      generatedId: dummyId,
      amount: Number(amount),
      type: "promo", // 🔥 BAS YEH LINE ADD KARNI HAI (Aap isko "plan" ya "dummy" bhi rakh sakte ho jo schema me allow ho)
      description: `Demo top-up generated for ID ${dummyId}`
    });

    res.json({ success: true, generatedId: dummyId, name: fullName });

  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
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

    // 2. 🔥 Agar Real mein nahi mila, toh 'DummyUser' table mein check karo
    if (!sponsor) {
      // Ensure karna ki DummyUser model upar require kiya hua hai
      if (typeof DummyUser !== 'undefined') {
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

router.get('/:userId', async (req, res) => {
  try {
    const rawUserId = req.params.userId;

    // 🛡️ 1. Validation
    if (!rawUserId || rawUserId === "undefined") {
      return res.status(400).json({ success: false, message: 'User ID is missing' });
    }

    let query = {};
    
    // 💡 2. Smart Detection: Check if it's a MongoDB _id or a Numerical userId
    if (mongoose.Types.ObjectId.isValid(rawUserId) && rawUserId.length === 24) {
      // Agar 24 character ki string hai, toh _id se dhoondo
      query = { _id: rawUserId };
    } else if (!isNaN(Number(rawUserId))) {
      // Agar number hai, toh userId field se dhoondo
      query = { userId: Number(rawUserId) };
    } else {
      // Agar dono nahi hai, toh bad request
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    // 3. Search User
    let user = await User.findOne(query).select('-password -transactionPassword -resetToken -__v');
    
    if (!user && typeof DummyUser !== 'undefined') {
        user = await DummyUser.findOne(query).select('-password -transactionPassword -resetToken -__v');
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 🏆 4. Sync Logic
    if (user.totalRewardIncome === 0 && user.rewardIncome > 0) {
        user.totalRewardIncome = user.rewardIncome;
        await user.save();
    }

    // 💰 5. Response
    res.json({ 
        success: true,
        user: user, 
        income: {
            totalDirectIncome: user.totalDirectIncome || user.directIncome || 0,
            totalLevelIncome: user.levelIncome || 0,
            totalRewardIncome: user.totalRewardIncome || user.rewardIncome || 0,
            totalIncome: (user.totalDirectIncome || 0) + (user.levelIncome || 0) + (user.totalRewardIncome || 0)
        }
    });

  } catch (err) {
    console.error("Error fetching user profile:", err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// ---------------------------
// Update user
// Update user - REPLACE YOUR EXISTING router.put('/:userId' ...) WITH THIS:
router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    const { walletAddress, oldTxnPassword } = req.body;
    const user = await User.findOne({ userId: Number(req.params.userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🔥 LOCK LOGIC: Check if any withdrawal is pending
    // Hum Withdrawal model me ja kar check karenge ki is user ki koi "pending" request hai ya nahi
    const Withdrawal = require('../models/Withdrawal'); // Model import ensure karein
    const pendingRequest = await Withdrawal.findOne({ userId: user.userId, status: 'pending' });

    if (walletAddress && walletAddress !== user.walletAddress) {
      if (pendingRequest) {
        return res.status(403).json({ 
          message: 'Wallet Locked: You cannot change address while a withdrawal is pending.' 
        });
      }

      // Baaki uniqueness check...
      const exists = await User.findOne({ walletAddress });
      if (exists) return res.status(403).json({ message: 'Address already in use.' });

      user.walletAddress = walletAddress;
    }

    // Baaki profile update logic...
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/check-wallet', async (req, res) => {
  const { walletAddress } = req.body;
  const exists = await User.findOne({ walletAddress });
  res.json({ exists: !!exists });
});




// ---------------------------
// Password Change
router.put('/change-password/:userId', async (req, res) => {
  const { oldPassword, newPassword, oldTxnPassword, newTxnPassword } = req.body;
  try {
    const user = await User.findOne({ userId: Number(req.params.userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (oldPassword && newPassword) {
      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) return res.status(403).json({ message: 'Incorrect old password' });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (oldTxnPassword && newTxnPassword) {
const matchTxn = (oldTxnPassword === user.transactionPassword);
      if (!matchTxn) return res.status(403).json({ message: 'Incorrect old transaction password' });
      user.transactionPassword = await bcrypt.hash(newTxnPassword, 10);
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