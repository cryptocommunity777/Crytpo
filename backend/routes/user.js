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
const FastTrack = require('../models/FastTrack');
 const checkFeature = require("../middleware/checkFeatureEnabled");
 const FakeUser = require('../models/FakeUser'); // Sahi path ke hisaab se check kar lena
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

// ---------------------------
// (Yahan se aapka aage ka code start hoga, jaise Top-up Route wagarah...)
 

// =======================================================
// 🔥 NEW $30 GLOBAL AUTO-POOL TOP-UP ROUTE 🔥
// =======================================================
// =======================================================
// 🔥 NEW $30 GLOBAL AUTO-POOL TOP-UP ROUTE 🔥
// =======================================================
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

      // 🔹 2. Wallet Check & Deduction
      if (!(isPromoFree && amount === 10) && !isPromo) {
        if (currentUser.walletBalance < amount) {
          return res.status(400).json({ message: 'Insufficient balance in wallet' });
        }
        await User.updateOne({ userId: currentUser.userId }, { $inc: { walletBalance: -amount } });
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
    // =======================================================
      // 🔹 4. BACKGROUND MLM ENGINE (Runs behind the scenes)
      // =======================================================
      (async () => {
          try {
              if (isFirstTopup) {
                   // 🌟 GLOBAL TEAM COUNT
                 // 🔥 SMART CAPPING ENGINE CALL (Real Topup)
      await processGlobalTeamGrowth(targetUser.userId);


                  if (targetUser.sponsorId) {
                      const sponsor = await User.findOne({ userId: targetUser.sponsorId });
                      
                      // ✅ SPONSOR INCOME (ONLY IF SPONSOR IS ACTIVE/TOPPED-UP)
                      if (sponsor && sponsor.isToppedUp) {
                          // DIRECT COUNT
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

                  // 🌟 UNIFIED 100-LEVEL ENGINE (Level Income + Leader Breakaway)
                  const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
                  let currentUplineId = targetUser.sponsorId; 
                  let currentLevel = 1;
                  
                  // 🔥 THE MAGIC LOCK: Check karega ki kya immediate leader ko paisa mil chuka hai
                  let leaderFoundAndPaid = false;

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

                      // 🛑 RULE 2: 2ND LEADER BLOCKER (Agar ek leader ko paisa mil chuka hai, aur ye doosra leader hai, toh SKIP karo)
                      if (isCurrentUplineLeader && leaderFoundAndPaid) {
                          console.log(`[BREAKAWAY] Skipped Leader ${upline.userId} at Level ${currentLevel} because Immediate Leader already paid.`);
                          currentUplineId = upline.sponsorId;
                          currentLevel++;
                          continue; 
                      }

                      // ============================================
                      // 1. INSTANT LEADER 10% LOGIC (Level 2 se 100 tak)
                      // ============================================
                      // Ye sirf us pehle (Immediate) leader ke liye chalega
                      if (currentLevel >= 2 && isCurrentUplineLeader && !leaderFoundAndPaid) {
                          const instantBonusAmount = (amount * 10) / 100;
                          
                          await User.updateOne(
                              { _id: upline._id }, 
                              { $inc: { walletBalance: instantBonusAmount } }
                          );
                          
                          await createTransaction({
                              userId: upline.userId, type: "credit_to_wallet", source: "instant_leader_bonus", amount: instantBonusAmount,
                              fromUserId: targetUser.userId, 
                              description: `10% Instant Leader Bonus from Downline Activation (Level ${currentLevel})`,
                              status: "success"
                          });

                          console.log(`✅ [NORMAL ROUTE -> LEADER BONUS] Paid $${instantBonusAmount} to Leader ${upline.userId}`);
                          
                          // 🔥 LOCK ACTIVATED: Iske baad aane wale saare leaders block ho jayenge
                          // Lekin humne "continue" hata diya hai, taaki is immediate leader ko Niche wali Level Income bhi mil sake!
                          leaderFoundAndPaid = true; 
                      }

                      // ============================================
                      // 2. LEVEL INCOME LOGIC (Level 2 se 20 tak)
                      // ============================================
                      // Yahan ya toh Normal Users aayenge, YA FIR wo Pehla (Immediate) Leader aayega
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

                      currentUplineId = upline.sponsorId;
                      currentLevel++;
                  }
              }
          } catch (bgError) {
              console.error("Background MLM Engine Error:", bgError);
          }
      })();
      // Background process bracket closed here

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

      // 🔥 NAYA CHECK: Agar ID pehle se topup hai toh yahin rok do 🔥
      if (targetUser.isToppedUp) {
          return res.status(400).json({ message: "Action Denied! This ID is already activated (Topped Up)." });
      }

      // 🔹 2. RELATIONSHIP CHECK (Direct, Self, or Downline)
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

      // 🔥 IS IT A DUMMY (SHOWCASE) TOPUP?
      const isDummyTopup = isDirectReferral || isSelfTopup;

      // 🔹 3. SMART WALLET CHECK
      let usableBalance = 0;

      if (isDummyTopup) {
        usableBalance = currentUser.walletBalance;
      } else {
        usableBalance = currentUser.walletBalance - 30;
      }

      if (usableBalance < amount) {
        if (isDummyTopup) {
            return res.status(400).json({ message: `Insufficient balance! You need at least $${amount} to activate this ID.` });
        } else {
            return res.status(400).json({ message: `Insufficient Earned Balance! You cannot use the $30 Leader Balance for indirect downlines. You need more than $${amount} in Your Wallet.` });
        }
      }
      
      // 🔥 PAISA KATEGA YA NAHI? 🔥
      if (isDummyTopup) {
        console.log(`[DUMMY TOPUP] Leader ${currentUser.userId} activated ${targetUser.userId}. Leader balance NOT deducted.`);
      } else {
        currentUser.walletBalance -= amount;
      }
      await currentUser.save();

      const createTransaction = async (data) => {
         const Transaction = require('../models/Transaction'); 
         return Transaction.create({ ...data, date: new Date() });
      };

      // 🔹 4. INSTANT RESPONSE & PROFILE UPDATE
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

      // 🔥 Send response instantly
      let successMsg = isDummyTopup 
          ? `Success! Dummy ID Activated. Incomes sent to dashboard only.` 
          : `Success! Used $${amount} REAL balance to activate Downline member. Real incomes distributed.`;
          
      res.json({ success: true, message: successMsg });


      // =======================================================
      // 🔹 5. BACKGROUND MLM ENGINE (LEADER BREAKAWAY SYSTEM)
      // =======================================================
      (async () => {
          try {
              if (isFirstTopup) {
                   // 🌟 GLOBAL TEAM COUNT
                // 🔥 SMART CAPPING ENGINE CALL (Leader Topup)
        await processGlobalTeamGrowth(targetUser.userId);

                  if (targetUser.sponsorId) {
                      const sponsor = await User.findOne({ userId: targetUser.sponsorId });
                      if (sponsor) {
                          
                          // ✅ DIRECT COUNT
                          sponsor.directCount = (sponsor.directCount || 0) + 1;

                          // ✅ DIRECT INCOME (10%)
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

                          // 🔥 FAST TRACK (Only for Real Topups)
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

                  // 🌟 UNIFIED 100-LEVEL ENGINE (Level Income + Leader Breakaway)
                  const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
                  let currentUplineId = targetUser.sponsorId; 
                  let currentLevel = 1;
                  
                  // 🔥 THE MAGIC LOCK: Ye check karega ki immediate leader ko paisa mila ya nahi
                  let leaderFoundAndPaid = false; 

                  while (currentUplineId && currentLevel <= 100) {
                      const upline = await User.findOne({ userId: currentUplineId }).select('userId isToppedUp sponsorId role');
                      if (!upline) break; 

                      const isCurrentUplineLeader = (upline.role === 'leader');
                      
                      // Agar ye leader hai, aur niche wale leader ko pehle hi paisa mil chuka hai, toh ise SKIP karo
                      const shouldSkipLeader = (isCurrentUplineLeader && leaderFoundAndPaid);

                      // ============================================
                      // 1. LEVEL INCOME LOGIC (Sirf Level 2 se Level 20 tak)
                      // ============================================
                      if (currentLevel >= 2 && currentLevel <= 20) {
                          if (!shouldSkipLeader && upline.isToppedUp) {
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

                      // ============================================
                      // 2. INSTANT LEADER 10% LOGIC (Level 2 se 100 tak) - Only Real Topup
                      // ============================================
                      if (!isDummyTopup && currentLevel >= 2) {
                          if (isCurrentUplineLeader && !leaderFoundAndPaid) {
                              const instantBonusAmount = (amount * 10) / 100;
                              
                              await User.updateOne(
                                  { _id: upline._id }, 
                                  { $inc: { walletBalance: instantBonusAmount } }
                              );
                              
                              await createTransaction({
                                  userId: upline.userId, type: "credit_to_wallet", source: "instant_leader_bonus", amount: instantBonusAmount,
                                  fromUserId: targetUser.userId, 
                                  description: `10% Instant Bonus from Downline Activation (Level ${currentLevel})`,
                                  status: "success"
                              });

                              // 🔥 LOCK ACTIVATED: Iske upar kisi leader ko ab kuch nahi milega
                              leaderFoundAndPaid = true; 
                          }
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

    // 2. 🔥 Get ANY RANDOM Fake User for TODAY ONLY
    const FakeUser = require('../models/FakeUser');
    
    // Aaj ka start (12:00 AM) aur end (11:59 PM) time set kar rahe hain
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const fakeUsers = await FakeUser.aggregate([
        { 
            $match: { 
                date: { $gte: startOfToday, $lte: endOfToday } // Sirf aaj ki date filter karega
            } 
        },
        { $sample: { size: 1 } } // Aaj ki list me se koi bhi 1 random uthayega
    ]);

    // Agar aaj ki date ka koi bhi fake user nahi mila table me
    if (!fakeUsers || fakeUsers.length === 0) {
        return res.status(400).json({ message: "Aaj ki date ki koi Fake ID database me nahi mili. Please aaj ke liye seed script run karein." });
    }

    const targetFakeUser = fakeUsers[0];

    // 3. 🛑 DATE YA DATA UPDATE NAHI KARNA HAI (Taki Global List disturb na ho)
    // Hum sirf Transaction table me entry marenge admin history ke liye
    
    // 4. Record Dummy Transaction
    const Transaction = require('../models/Transaction'); 
    await Transaction.create({
      userId: targetFakeUser.userId,
      amount: Number(amount),
      type: "promo", 
      fromUserId: currentUser.userId,
      toUserId: targetFakeUser.userId,
      status: "success",
      description: `Promo showcase generated for Fake ID ${targetFakeUser.userId}`,
      date: new Date()
    });

    // 5. Success Response for Frontend Popup
    res.json({ 
        success: true, 
        generatedId: targetFakeUser.userId, 
        name: targetFakeUser.name 
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

    // 3. Search Real User
    let user = await User.findOne(query).select('-password -transactionPassword -resetToken -__v');
    let isFake = false;
    
    // 🔥 4. Search Fake User if Real not found
    if (!user) {
        const FakeUser = require('../models/FakeUser'); // File path check kar lena
        user = await FakeUser.findOne(query).select('-__v');
        
        // Backup ke liye DummyUser ka check (agar purani IDs hon)
        if (!user && typeof DummyUser !== 'undefined') {
            user = await DummyUser.findOne(query).select('-__v');
        }

        // Agar Fake/Dummy user mil gaya
        if (user) {
            isFake = true;
            // Mongoose document ko plain Javascript object me convert karo taaki hum modify kar sakein
            user = user.toObject ? user.toObject() : user;
            
            // 🚨 FRONTEND CRASH FIX: Frontend 'packages' array me check karta hai ki ID topup hai ya nahi
            if (user.isToppedUp && (!user.packages || user.packages.length === 0)) {
                user.packages = [{ amount: user.topUpAmount || 30 }];
            }
        }
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 🏆 5. Sync Logic (Sirf Real User par chalega kyunki FakeUser plain object me convert ho chuka hai)
    if (!isFake && user.totalRewardIncome === 0 && user.rewardIncome > 0) {
        user.totalRewardIncome = user.rewardIncome;
        await user.save();
    }

    // 💰 6. Response
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
// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\user.js

const sanitizeUser = require('../utils/sanitizeUser'); // Isko top par check kar lena

router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    const { walletAddress, oldTxnPassword, name, email, mobile } = req.body;

    // 1. Find User
    const user = await User.findOne({ userId: Number(req.params.userId) });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Transaction Password Verify
    if (!oldTxnPassword || oldTxnPassword !== user.transactionPassword) {
      return res.status(403).json({
        message: 'Invalid Transaction Password.'
      });
    }

    // 3. 🔒 PERMANENT WALLET LOCK LOGIC
    if (walletAddress && walletAddress.trim() !== '') {
      
      // Agar user ke paas already ek address hai, aur wo change karna chah raha hai
      if (user.walletAddress && user.walletAddress.trim() !== '' && walletAddress !== user.walletAddress) {
        return res.status(403).json({
          message: 'Wallet Locked: Wallet address cannot be changed once it is set.'
        });
      }

      // Agar address khali tha, toh set karne do
      if (walletAddress !== user.walletAddress) {
        user.walletAddress = walletAddress;

        // Note: Change count & window start ab zaroori nahi hain (kyunki change allow hi nahi hai), 
        // par DB records ke liye aap rakh sakte ho.
        user.walletAddressChangeCount = (user.walletAddressChangeCount || 0) + 1;
        user.walletAddressChangeWindowStart = new Date();
      }
    }

    // 4. Other Fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;

    // 5. Save
    await user.save();

    // 6. Response
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(user) // Ensure sanitizeUser function available ho
    });

  } catch (err) {
    console.error('Profile Update Error:', err);

    res.status(500).json({
      message: 'Server error'
    });
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

    // 🔥 1. LOGIN PASSWORD CHECK (Plain Text)
    if (oldPassword && newPassword) {
      if (oldPassword !== user.password) {
        return res.status(403).json({ message: 'Incorrect old login password' });
      }
      // Naya password normal text mein save hoga
      user.password = newPassword; 
    }

    // 🔥 2. TRANSACTION PASSWORD CHECK (Plain Text)
    if (oldTxnPassword && newTxnPassword) {
      if (oldTxnPassword !== user.transactionPassword) {
        return res.status(403).json({ message: 'Incorrect old transaction password' });
      }
      // Naya txn password bhi normal text mein save hoga
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