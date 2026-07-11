// routes/staking.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const Withdrawal = require('../models/Withdrawal'); // Ye top par add kar lena
// 1. Get Staking Stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            success: true,
            data: {
                walletBalance: user.walletBalance || 0,
                cctBalance: user.cctBalance || 0,
                cctStakingIncome: user.cctStakingIncome || 0,
                
                // 🔥 FRONTEND KE NAYE 6 BOXES KE LIYE TOTAL INCOMES 🔥
                cctStakingDirectIncome: user.cctStakingDirectIncome || 0,
                cctStakingLevelIncome: user.cctStakingLevelIncome || 0,  
                
                totalCctStaked: user.totalCctStaked || 0,
                stakedMaxCap: user.stakedMaxCap || 0,
                stakedEarned: user.stakedEarned || 0,
                isStaked: user.isStaked || false,
                
                // 🔥 TIMER KE LIYE FIELDS 🔥
                isToppedUp: user.isToppedUp || false,
                topUpDate: user.topUpDate || null,
                createdAt: user.createdAt || null
            }
        });
    } catch (err) {
        console.error("Stats Fetch Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});
// 2. Convert Wallet Balance to CCT (100% conversion)
router.post('/convert', authMiddleware, async (req, res) => {
    try {
        const { amount, transactionPassword } = req.body;
        const user = await User.findOne({ userId: req.user.userId });
        
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.transactionPassword.toLowerCase() !== transactionPassword.toLowerCase()) {
            return res.status(400).json({ message: "Invalid Transaction Password" });
        }
        
        const convertAmt = Number(amount);
        if (convertAmt < 1) return res.status(400).json({ message: "Invalid amount. Minimum convert amount is $1." });
        
        // Optional: Agar transfer ki tarah decimals allow nahi karne hain
        if (!Number.isInteger(convertAmt)) {
            return res.status(400).json({ message: "Convert amount must be a whole number." });
        }

        // 🔥 LEADER $30 LOCKED BALANCE CHECK 🔥
        let usableBalance = user.walletBalance;
        
        if (user.role === 'leader') {
            usableBalance = user.walletBalance - 30; // Leader ka $30 fix/locked hai
            
            if (convertAmt > usableBalance) {
                return res.status(400).json({ 
                    message: `Insufficient Earned Balance! You cannot convert the $30 Leader Package Balance. You have $${usableBalance > 0 ? usableBalance.toFixed(2) : 0} available to convert.` 
                });
            }
        } else {
            // Normal User Check
            if (convertAmt > usableBalance) {
                return res.status(400).json({ message: "Insufficient Wallet Balance" });
            }
        }

        // Deduct from wallet, Add to CCT
        user.walletBalance -= convertAmt;
        user.cctBalance = (user.cctBalance || 0) + convertAmt;
        await user.save();

        await Transaction.create({
            userId: user.userId, type: 'convert_to_cct', amount: convertAmt, status: 'success',
            description: `Converted $${convertAmt} Wallet Balance to ${convertAmt} CCT`, date: new Date()
        });

        res.json({ success: true, message: `Successfully converted $${convertAmt} to CCT.` });
    } catch (err) {
        console.error("Convert Error:", err);
        res.status(500).json({ message: 'Server error during conversion' });
    }
});


router.post('/cct-transfer', authMiddleware, async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, transactionPassword } = req.body;

    const [sender, receiver] = await Promise.all([
      User.findOne({ userId: Number(fromUserId) }),
      User.findOne({ userId: Number(toUserId) }),
    ]);

    if (!sender) return res.status(404).json({ message: 'Sender not found' });
    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

    const amt = Number(amount);
    
    // ✨ LIMIT CHECK: Minimum 10 CCT
    if (amt < 10) return res.status(400).json({ message: "Minimum transfer amount is 10 CCT" });

    // ✨ INTEGER CHECK: Koi decimal nahi (e.g., 10, 11, 12 allow hoga)
    if (amt % 1 !== 0) return res.status(400).json({ message: "Decimals not allowed. Please enter a whole number." });

    // 🔥 PROMO USER LOGIC (Bypass for testing/promo if needed)
    if (sender.role === "promo") {
        sender.cctBalance -= amt;
        receiver.cctBalance += amt;
        await sender.save();
        await receiver.save();
        return res.json({ message: 'CCT Transfer successful (Promo Mode)' });
    }

    // ============================================
    // 🛡️ STRICT RULES & CHECKS START
    // ============================================

    // 🛑 RULE 1: SENDER MUST HAVE ACTIVE STAKING (Leader is Exempted)
    // Agar user leader nahi hai AUR usne stake nahi kiya hai, tabhi block hoga
    if (!sender.isStaked && sender.role !== 'leader') {
        return res.status(403).json({ message: 'Transfer Denied: You must have an active CCT Staking to use this feature.' });
    }

    // 🛑 RULE 2: PASSWORD CHECK
    const isPasswordValid = (transactionPassword.toLowerCase() === sender.transactionPassword.toLowerCase());
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid transaction password' });
    }

    // 🛑 RULE 3: CCT BALANCE CHECK
    if ((sender.cctBalance || 0) < amt) {
      return res.status(400).json({ message: 'Insufficient CCT balance' });
    }

    // 🛑 RULE 4: STRICT DOWNLINE CHECK (Sirf Downline me transfer allow hoga)
    let isDownline = false;
    let currentSponsorId = receiver.sponsorId;
    let depth = 0;
    const maxDepth = 1000; // Infinite loop protection

    while (currentSponsorId && depth < maxDepth) {
      if (Number(currentSponsorId) === Number(sender.userId)) {
        isDownline = true; // Mil gaya! Sender iska upline hai (Yani Receiver downline me hai)
        break;
      }
      
      // Upar ki taraf search badhao
      const uplineUser = await User.findOne({ userId: Number(currentSponsorId) }).lean();
      if (!uplineUser) break; 
      
      currentSponsorId = uplineUser.sponsorId;
      depth++;
    }

    // Agar downline nahi hai, toh error throw karo (No Upline, No Crossline)
    if (!isDownline) {
      return res.status(403).json({ message: 'Transfer restricted. You can only transfer CCT to your direct or downline team members.' });
    }

    // ============================================
    // 💸 CCT TRANSFER EXECUTION
    // ============================================
    sender.cctBalance -= amt;
    receiver.cctBalance = (receiver.cctBalance || 0) + amt;

    await sender.save();
    await receiver.save();

    // Sender ki Transaction Report
    await Transaction.create({
      userId: sender.userId,
      type: 'cct_transfer', // Specific type for CCT
      fromUserId: sender.userId,
      toUserId: receiver.userId,
      amount: amt,
      grossAmount: amt,
      status: 'success',
      description: `Transferred ${amt} CCT to Downline ID #${receiver.userId}`,
      date: new Date()
    });

    res.json({ success: true, message: 'CCT Transfer successful' });

  } catch (err) {
    console.error("CCT Transfer error:", err);
    res.status(500).json({ message: 'CCT Transfer failed due to server error' });
  }
});

// 3. Stake CCT (Self or Downline)
// router.post('/stake', authMiddleware, async (req, res) => {
//     try {
//         const { targetUserId, amount, transactionPassword } = req.body;
//         const user = await User.findOne({ userId: req.user.userId });
//         const targetUser = await User.findOne({ userId: targetUserId });

//         if (!user) return res.status(404).json({ message: "Sender not found" });
//         if (!targetUser) return res.status(404).json({ message: "Target User ID not found" });
        
//         if (user.transactionPassword.toLowerCase() !== transactionPassword.toLowerCase()) {
//             return res.status(400).json({ message: "Invalid Transaction Password" });
//         }
        
//         const stakeAmt = Number(amount);
//         if (stakeAmt < 100 || stakeAmt > 1999) {
//             return res.status(400).json({ message: "Staking amount must be between 100 and 1999 CCT." });
//         }
//         if (user.cctBalance < stakeAmt) {
//             return res.status(400).json({ message: "Insufficient CCT Balance" });
//         }

//         // 🔥 RULE: NORMAL USER MUST STAKE THEIR OWN ID FIRST BEFORE STAKING FOR DOWNLINE
//         if (user.role !== 'leader' && !user.isStaked && String(user.userId) !== String(targetUser.userId)) {
//             return res.status(403).json({ 
//                 message: "Self-Stake Required: You must activate Staking on your own ID first before staking for your downline." 
//             });
//         }

//         // 🛑 RULE 1: MUST BE TOPPED UP ($30 ACTIVE ID)
//         if (!targetUser.isToppedUp) {
//             return res.status(400).json({ message: "Target ID must be Active (Topped Up) to participate in Staking." });
//         }

//         // 🛑 RULE 4: LEADER CANNOT STAKE ON THEIR OWN ID
//         if (targetUser.role === 'leader' && String(targetUser.userId) === String(user.userId)) {
//             return res.status(403).json({ 
//                 message: "You are not allowed to stake on your own ID." 
//             });
//         }

//         // 🛑 RULE 3: 15-DAY TIME LIMIT CHECK (For 1% or 0.5% rate)
//         const STAKING_START_DATE = new Date("2026-07-03T00:01:00+05:30");
//         const STAKING_WINDOW_DAYS = 15;
//         const userTopUpDate = targetUser.topUpDate || targetUser.createdAt; 
        
//         let stakingDeadline;
//         if (userTopUpDate < STAKING_START_DATE) {
//             stakingDeadline = new Date(STAKING_START_DATE.getTime() + (STAKING_WINDOW_DAYS * 24 * 60 * 60 * 1000));
//         } else {
//             stakingDeadline = new Date(userTopUpDate.getTime() + (STAKING_WINDOW_DAYS * 24 * 60 * 60 * 1000));
//         }

//         // 🔥 Rate Decide Hoga Yahan Har Naye Stake Ke Liye
//         let dailyRate = 1.0; 
//         if (new Date() > stakingDeadline) {
//             dailyRate = 0.5; // Late penalty: Daily half milega
//         }

//         // 🔹 MAX CAP CALCULATION
//         let maxCap = 0;
//         if (stakeAmt >= 100 && stakeAmt <= 499) maxCap = stakeAmt * 3;
//         else if (stakeAmt >= 500 && stakeAmt <= 999) maxCap = stakeAmt * 4;
//         else if (stakeAmt >= 1000 && stakeAmt <= 1999) maxCap = stakeAmt * 5;

//         // 🔥 NAYA LOGIC: Har stake ko alag pehchan dene ke liye Object banaya
//         const newStakeRecord = {
//             amount: stakeAmt,
//             maxCap: maxCap,
//             earned: 0,
//             dailyRate: dailyRate,
//             createdAt: new Date(),
//             status: 'active'
//         };

//         // =======================================================
//         // 🔥 FIX: PURANE USERS KO NAYE ARRAY SYSTEM MEIN SHIFT KARNA (AUTO-MIGRATION)
//         // =======================================================
//         if (!targetUser.activeStakes) {
//             targetUser.activeStakes = [];
//         }

//         // Agar user ne pehle stake kiya tha, aur uski array khali hai, toh usko array me daal do
//         if (targetUser.isStaked && targetUser.activeStakes.length === 0 && targetUser.totalCctStaked > 0) {
//             targetUser.activeStakes.push({
//                 amount: targetUser.totalCctStaked,
//                 maxCap: targetUser.stakedMaxCap,
//                 earned: targetUser.stakedEarned || 0,
//                 dailyRate: targetUser.stakingDailyRate || 1.0,
//                 createdAt: targetUser.createdAt || new Date(),
//                 status: 'active'
//             });
//         }

//         // Ab naya stake push kar do (Purana aur naya alag-alag track honge)
//         targetUser.activeStakes.push(newStakeRecord);

//         // Balance Katna
//         if (String(user.userId) === String(targetUser.userId)) {
//             targetUser.cctBalance -= stakeAmt;
//         } else {
//             user.cctBalance -= stakeAmt;
//             await user.save(); 
//         }

//         // UI me Total dikhane ke liye sum update hoga
//         targetUser.isStaked = true;
//         targetUser.totalCctStaked = (targetUser.totalCctStaked || 0) + stakeAmt;

//  if (!targetUser.firstStakeDate) {
//     targetUser.firstStakeDate = new Date();
// }

// targetUser.stakedMaxCap = (targetUser.stakedMaxCap || 0) + maxCap;

//          targetUser.stakingDailyRate = dailyRate; // Fallback field
        
//         await targetUser.save();

//         await Transaction.create({
//             userId: user.userId, type: 'cct_stake_send', amount: stakeAmt, status: 'success',
//             description: `Staked ${stakeAmt} CCT for ID #${targetUser.userId} (Rate: ${dailyRate}%)`, date: new Date()
//         });

//         // =======================================================
//         // 🔥 BACKGROUND MLM ENGINE FOR STAKING (SEPARATE WALLETS)
//         // =======================================================
//         (async () => {
//             try {
//                 // ✅ 1. DIRECT INCOME LOGIC
//                 if (targetUser.sponsorId) {
//                     const sponsor = await User.findOne({ userId: targetUser.sponsorId });
                    
//                     if (sponsor && sponsor.isToppedUp && sponsor.isStaked) {
//                         const STAKING_DIRECT_PERCENT = 10; 
//                         const directBonus = (stakeAmt * STAKING_DIRECT_PERCENT) / 100; 

//                         if (directBonus > 0) {
//                             sponsor.cctStakingDirectIncome = (sponsor.cctStakingDirectIncome || 0) + directBonus;
//                             await sponsor.save();

//                             await Transaction.create({
//                                 userId: sponsor.userId, type: "staking_direct_income", source: "cct_direct", amount: directBonus, 
//                                 fromUserId: targetUser.userId,
//                                 description: `Direct Bonus (10%) from ${targetUser.name}'s New Stake of ${stakeAmt} CCT`, 
//                                 status: 'success', date: new Date()
//                             });
//                         }
//                     } else if (sponsor) {
//                         console.log(`[FLUSHED] Staking Direct Income flushed.`);
//                     }
//                 }

//                 // ✅ 2. UNIFIED 100-LEVEL ENGINE
//                 const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
//                 let currentUplineId = targetUser.sponsorId; 
//                 let currentLevel = 1;
//                 let leaderBonusGiven = false;

//                 while (currentUplineId && currentLevel <= 100) {
//                     const upline = await User.findOne({ userId: currentUplineId }).select('userId isToppedUp isStaked sponsorId role totalCctStaked');
//                     if (!upline) break;

//                     const isCurrentUplineLeader = (upline.role === 'leader');

//                     // ============================================
//                     // A. NORMAL LEVEL INCOME LOGIC (Level 2 to 20)
//                     // ============================================
//                     if (currentLevel >= 2 && currentLevel <= 20) {
//                         if (upline.isToppedUp && upline.isStaked) {
//                             const percentage = LEVEL_PERCENTAGES[currentLevel - 1];
//                             const levelBonus = (stakeAmt * percentage) / 100;

//                             if (levelBonus > 0) {
//                                 await User.updateOne(
//                                     { _id: upline._id }, 
//                                     { $inc: { cctStakingLevelIncome: levelBonus } }
//                                 );

//                                 await Transaction.create({
//                                     userId: upline.userId, type: "staking_level_income", source: "cct_level", amount: levelBonus,
//                                     fromUserId: targetUser.userId, 
//                                     description: `Level ${currentLevel} Staking Income (${percentage}%) from ${targetUser.name}'s New Stake`, 
//                                     status: 'success', date: new Date()
//                                 });
//                             }
//                         }
//                     }

//                     // ============================================
//                     // B. LEADER BREAKAWAY BONUS 5% LOGIC
//                     // ============================================
//                     if (currentLevel >= 1 && isCurrentUplineLeader && !leaderBonusGiven) {
//                         if (upline.isToppedUp) {
//                             const leaderBonusAmount = (stakeAmt * 10) / 100; 
                            
//                             if (leaderBonusAmount > 0) {
//                                 await User.updateOne(
//                                     { _id: upline._id }, 
//                                     { $inc: { cctBalance: leaderBonusAmount } }
//                                 );
                                
//                                 await Transaction.create({
//                                     userId: upline.userId, type: "credit", source: "system", amount: leaderBonusAmount,
//                                     fromUserId: targetUser.userId, 
//                                     description: `5% Instant Leader Staking Bonus (No Stake Req.) added to CCT Wallet (Level ${currentLevel})`,
//                                     status: "success", date: new Date()
//                                 });
//                             }
//                         }
//                         leaderBonusGiven = true; 
//                     }

//                     currentUplineId = upline.sponsorId;
//                     currentLevel++;
//                 }
//             } catch (bgError) {
//                 console.error("Background Staking MLM Engine Error:", bgError);
//             }
//         })();

//         res.json({ success: true, message: `Successfully staked ${stakeAmt} CCT for ID #${targetUser.userId}` });
//     } catch (err) {
//         console.error("Staking Error:", err);
//         res.status(500).json({ message: 'Server error during staking' });
//     }
// });

router.post('/stake', authMiddleware, async (req, res) => {
    try {
        const { targetUserId, amount, transactionPassword } = req.body;
        const user = await User.findOne({ userId: req.user.userId });
        const targetUser = await User.findOne({ userId: targetUserId });

        if (!user) return res.status(404).json({ message: "Sender not found" });
        if (!targetUser) return res.status(404).json({ message: "Target User ID not found" });
        
        if (user.transactionPassword.toLowerCase() !== transactionPassword.toLowerCase()) {
            return res.status(400).json({ message: "Invalid Transaction Password" });
        }
        
        const stakeAmt = Number(amount);
        if (stakeAmt < 100 || stakeAmt > 1999) {
            return res.status(400).json({ message: "Staking amount must be between 100 and 1999 CCT." });
        }
        if (user.cctBalance < stakeAmt) {
            return res.status(400).json({ message: "Insufficient CCT Balance" });
        }

        // 🔥 RULE: NORMAL USER MUST STAKE THEIR OWN ID FIRST BEFORE STAKING FOR DOWNLINE
        if (user.role !== 'leader' && user.role !== 'superleader' && !user.isStaked && String(user.userId) !== String(targetUser.userId)) {
            return res.status(403).json({ 
                message: "Self-Stake Required: You must activate Staking on your own ID first before staking for your downline." 
            });
        }

        // 🛑 RULE 1: MUST BE TOPPED UP ($30 ACTIVE ID)
        if (!targetUser.isToppedUp) {
            return res.status(400).json({ message: "Target ID must be Active (Topped Up) to participate in Staking." });
        }

        // 🛑 RULE 4: LEADER CANNOT STAKE ON THEIR OWN ID (Super Leader IS allowed)
        // ✅ NAYA FIX: Removed Super Leader from this restriction
        if (targetUser.role === 'leader' && String(targetUser.userId) === String(user.userId)) {
            return res.status(403).json({ 
                message: "You are not allowed to stake on your own ID." 
            });
        }

        // 🛑 RULE 3: 15-DAY TIME LIMIT CHECK (For 1% or 0.5% rate)
        const STAKING_START_DATE = new Date("2026-07-03T00:01:00+05:30");
        const STAKING_WINDOW_DAYS = 15;
        const userTopUpDate = targetUser.topUpDate || targetUser.createdAt; 
        
        let stakingDeadline;
        if (userTopUpDate < STAKING_START_DATE) {
            stakingDeadline = new Date(STAKING_START_DATE.getTime() + (STAKING_WINDOW_DAYS * 24 * 60 * 60 * 1000));
        } else {
            stakingDeadline = new Date(userTopUpDate.getTime() + (STAKING_WINDOW_DAYS * 24 * 60 * 60 * 1000));
        }

        // 🔥 Rate Decide Hoga Yahan Har Naye Stake Ke Liye
        let dailyRate = 1.0; 
        if (new Date() > stakingDeadline) {
            dailyRate = 0.5; // Late penalty: Daily half milega
        }

        // 🔹 MAX CAP CALCULATION
        let maxCap = 0;
        if (stakeAmt >= 100 && stakeAmt <= 499) maxCap = stakeAmt * 3;
        else if (stakeAmt >= 500 && stakeAmt <= 999) maxCap = stakeAmt * 4;
        else if (stakeAmt >= 1000 && stakeAmt <= 1999) maxCap = stakeAmt * 5;

        // 🔥 NAYA LOGIC: Har stake ko alag pehchan dene ke liye Object banaya
        const newStakeRecord = {
            amount: stakeAmt,
            maxCap: maxCap,
            earned: 0,
            dailyRate: dailyRate,
            createdAt: new Date(),
            status: 'active'
        };

        // =======================================================
        // 🔥 FIX: PURANE USERS KO NAYE ARRAY SYSTEM MEIN SHIFT KARNA (AUTO-MIGRATION)
        // =======================================================
        if (!targetUser.activeStakes) {
            targetUser.activeStakes = [];
        }

        // Agar user ne pehle stake kiya tha, aur uski array khali hai, toh usko array me daal do
        if (targetUser.isStaked && targetUser.activeStakes.length === 0 && targetUser.totalCctStaked > 0) {
            targetUser.activeStakes.push({
                amount: targetUser.totalCctStaked,
                maxCap: targetUser.stakedMaxCap,
                earned: targetUser.stakedEarned || 0,
                dailyRate: targetUser.stakingDailyRate || 1.0,
                createdAt: targetUser.createdAt || new Date(),
                status: 'active'
            });
        }

        // Ab naya stake push kar do (Purana aur naya alag-alag track honge)
        targetUser.activeStakes.push(newStakeRecord);

        // Balance Katna
        if (String(user.userId) === String(targetUser.userId)) {
            targetUser.cctBalance -= stakeAmt;
        } else {
            user.cctBalance -= stakeAmt;
            await user.save(); 
        }

        // UI me Total dikhane ke liye sum update hoga
        targetUser.isStaked = true;
        targetUser.totalCctStaked = (targetUser.totalCctStaked || 0) + stakeAmt;

        if (!targetUser.firstStakeDate) {
            targetUser.firstStakeDate = new Date();
        }

        targetUser.stakedMaxCap = (targetUser.stakedMaxCap || 0) + maxCap;
        targetUser.stakingDailyRate = dailyRate; // Fallback field
        
        await targetUser.save();

        await Transaction.create({
            userId: user.userId, type: 'cct_stake_send', amount: stakeAmt, status: 'success',
            description: `Staked ${stakeAmt} CCT for ID #${targetUser.userId} (Rate: ${dailyRate}%)`, date: new Date()
        });

        // =======================================================
        // 🔥 BACKGROUND MLM ENGINE FOR STAKING (SEPARATE WALLETS)
        // =======================================================
        (async () => {
            try {
                // ✅ 1. DIRECT INCOME LOGIC
                if (targetUser.sponsorId) {
                    const sponsor = await User.findOne({ userId: targetUser.sponsorId });
                    
                    if (sponsor && sponsor.isToppedUp && sponsor.isStaked) {
                        const STAKING_DIRECT_PERCENT = 10; 
                        const directBonus = (stakeAmt * STAKING_DIRECT_PERCENT) / 100; 

                        if (directBonus > 0) {
                            sponsor.cctStakingDirectIncome = (sponsor.cctStakingDirectIncome || 0) + directBonus;
                            await sponsor.save();

                            await Transaction.create({
                                userId: sponsor.userId, type: "staking_direct_income", source: "cct_direct", amount: directBonus, 
                                fromUserId: targetUser.userId,
                                description: `Direct Bonus (10%) from ${targetUser.name}'s New Stake of ${stakeAmt} CCT`, 
                                status: 'success', date: new Date()
                            });
                        }
                    } else if (sponsor) {
                        console.log(`[FLUSHED] Staking Direct Income flushed.`);
                    }
                }

                // ✅ 2. UNIFIED 100-LEVEL ENGINE
                const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
                let currentUplineId = targetUser.sponsorId; 
                let currentLevel = 1;
                let leaderBonusGiven = false;

                while (currentUplineId && currentLevel <= 100) {
                    const upline = await User.findOne({ userId: currentUplineId }).select('userId isToppedUp isStaked sponsorId role totalCctStaked');
                    if (!upline) break;

                    const isCurrentUplineLeader = (upline.role === 'leader');

                    // ============================================
                    // A. NORMAL LEVEL INCOME LOGIC (Level 2 to 20)
                    // ============================================
                    if (currentLevel >= 2 && currentLevel <= 20) {
                        // 🔥 NOTE: Upline needs to be staked to get Level Income
                        if (upline.isToppedUp && upline.isStaked) {
                            const percentage = LEVEL_PERCENTAGES[currentLevel - 1];
                            const levelBonus = (stakeAmt * percentage) / 100;

                            if (levelBonus > 0) {
                                await User.updateOne(
                                    { _id: upline._id }, 
                                    { $inc: { cctStakingLevelIncome: levelBonus } }
                                );

                                await Transaction.create({
                                    userId: upline.userId, type: "staking_level_income", source: "cct_level", amount: levelBonus,
                                    fromUserId: targetUser.userId, 
                                    description: `Level ${currentLevel} Staking Income (${percentage}%) from ${targetUser.name}'s New Stake`, 
                                    status: 'success', date: new Date()
                                });
                            }
                        }
                    }

                    // ============================================
                    // B. LEADER BREAKAWAY BONUS 10% LOGIC
                    // ============================================
                    if (currentLevel >= 1 && isCurrentUplineLeader && !leaderBonusGiven) {
                        if (upline.isToppedUp) {
                            const leaderBonusAmount = (stakeAmt * 10) / 100; 
                            
                            if (leaderBonusAmount > 0) {
                                await User.updateOne(
                                    { _id: upline._id }, 
                                    { $inc: { cctBalance: leaderBonusAmount } }
                                );
                                
                                await Transaction.create({
                                    userId: upline.userId, type: "credit", source: "system", amount: leaderBonusAmount,
                                    fromUserId: targetUser.userId, 
                                    description: `10% Instant Leader Staking Bonus (No Stake Req.) added to CCT Wallet (Level ${currentLevel})`,
                                    status: "success", date: new Date()
                                });
                            }
                        }
                        leaderBonusGiven = true; 
                    }

                    currentUplineId = upline.sponsorId;
                    currentLevel++;
                }
            } catch (bgError) {
                console.error("Background Staking MLM Engine Error:", bgError);
            }
        })();

        res.json({ success: true, message: `Successfully staked ${stakeAmt} CCT for ID #${targetUser.userId}` });
    } catch (err) {
        console.error("Staking Error:", err);
        res.status(500).json({ message: 'Server error during staking' });
    }
});

router.post("/promo-stake", authMiddleware, async (req, res) => {
  try {
    const { amount, transactionPassword } = req.body;

    const currentUser = await User.findOne({ userId: req.user.userId });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // 🛡️ Role Security Check (Only for Promo Users)
    if (currentUser.role !== "promo") {
      return res.status(403).json({ message: "Unauthorized: For promo users only." });
    }

    // 1. Password Check
    const isPasswordValid = (transactionPassword.toLowerCase() === currentUser.transactionPassword.toLowerCase());
    if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

    // 💰 Amount Verification (100 to 1999 CCT)
    const stakeAmt = Number(amount);
    if (isNaN(stakeAmt) || stakeAmt < 100 || stakeAmt > 1999) {
      return res.status(400).json({ message: "Staking amount must be between 100 and 1999 CCT." });
    }

    // ==========================================
    // 2. 🔥 90% ARRAY / 10% DATABASE LOGIC
   const indianNames = [
  "Aarav Patil", "Rohan Sharma", "Aditya Singh", "Rahul Verma", "Vikas Yadav", "Amit Kumar", "Ankit Gupta", 
  "Sandeep Mishra", "Vivek Tiwari", "Rajesh Patel", "Mohit Sharma", "Ravi Yadav", "Akash Singh", "Deepak Verma", 
  "Pankaj Kumar", "Nitin Sharma", "Karan Malhotra", "Saurabh Gupta", "Abhishek Jain", "Manish Patel", 
  "Harsh Mehta", "Yash Shah", "Dhruv Patel", "Jay Mehta", "Meet Shah", "Kunal Joshi", "Rakesh Solanki", 
  "Pravin Chauhan", "Siya Oberoi", "Meher Juneja", "Aarohi Sethi", "Shanaya Mehra", "Aarav Deshmukh",
  "Priya Sharma", "Neha Gupta", "Pooja Singh", "Sneha Verma", "Riya Patel", "Anjali Yadav", "Kavita Mishra",
  "Simran Kaur", "Komal Sharma", "Aarti Tiwari", "Megha Verma", "Swati Gupta", "Ritu Singh", "Nisha Sharma",
  "Divya Patel", "Pallavi Verma", "Shreya Gupta", "Anita Singh", "Monika Yadav", "Jyoti Mishra", "Sonia Sharma",
  "Rashmi Patel", "Preeti Verma", "Sakshi Gupta", "Tanya Singh", "Payal Sharma", "Madhuri Patel", "Nandini Verma",
  "Khushi Gupta", "Isha Singh", "Radhika Sharma", "Muskan Patel", "Ananya Verma", "Kiara Gupta", "Myra Singh",
  "Arjun Kapoor", "Kabir Khanna", "Vivaan Arora", "Ishaan Malhotra", "Reyansh Sethi", "Ayaan Batra", "Dev Sharma",
  "Aryan Gupta", "Krish Verma", "Laksh Yadav", "Vihaan Patel", "Shaurya Singh", "Atharva Joshi", "Ayan Desai",
  "Om Kadam", "Rishi Shinde", "Nikhil Pawar", "Pranav Chavan", "Karthik Iyer", "Sanjay Reddy", "Manoj Gowda",
  "Suresh Naidu", "Ramesh Rao", "Vinay Shetty", "Ashok Kumar", "Sunil Menon", "Anil Nair", "Ajay Pillai",
  "Vijay Swamy", "Prakash Das", "Pramod Bose", "Raj Roy", "Tarun Sen", "Vishal Dutta", "Pradeep Banerjee",
  "Suraj Chatterjee", "Aman Mukherjee", "Alok Sengupta", "Sameer Sahoo", "Anand Mohanty", "Mahesh Panda", 
  "Ganesh Nayak", "Kiran Pradhan", "Santosh Rout", "Naveen Behera", "Dinesh Mahapatra", "Mukesh Thakur",
  "Subhash Rajput", "Arvind Rathore", "Hemant Shekhawat", "Gaurav Jha", "Neeraj Pandey", "Ashish Dubey",
  "Prateek Tripathi", "Mohsin Khan", "Imran Shaikh", "Irfan Ali", "Sameer Syed", "Aryan Qureshi", "Kabir Ansari",
  "Ayush Agarwal", "Rishabh Bansal", "Gautam Garg", "Chirag Goyal", "Hardik Singhal", "Nilesh Mittal", 
  "Vijay Parmar", "Sanjay Bhatt", "Rohit Trivedi", "Vikas Mehra", "Anurag Singh", "Shubham Yadav", "Kartik Sharma",
  "Prashant Tiwari", "Ritesh Verma", "Sachin Mishra", "Vinay Kumar", "Akhil Gupta", "Rajat Singh", "Harshit Jain",
  "Sumit Patel", "Aakash Rao", "Ramesh Gowda", "Suresh Naidu", "Vinod Reddy", "Prakash Rao", "Mahesh Gowda",
  "Harsha Naik", "Lokesh Shetty", "Ganesh Hegde", "Kiran Acharya", "Darshan Rao", "Naveen Gowda", "Tejas Shetty",
  "Raghav Rao", "Anand Murthy", "Pradeep Hegde", "Manjunath Naik", "Srinivas Rao", "Venkatesh Gowda", "Ashwin Shetty",
  "Arvind Menon", "Rahul Nair", "Joseph Mathew", "Bibin George", "Vishnu Pillai", "Akhil Kurup", "Nikhil Menon",
  "Sandeep Nair", "Manu Varghese", "Rakesh Panicker", "Karthik Iyer", "Arjun Subramanian", "Hari Krishnan",
  "Pravin Natarajan", "Ashwin Balaji", "Raghav Raman", "Vivek Chandran", "Naveen Iyer", "Gokul Swamy",
  "Dinesh Pillai", "Sai Reddy", "Praneeth Goud", "Venkatesh Naidu", "Harsha Varma", "Ajay Chowdary", "Ram Charan",
  "Surya Teja", "Nani Krishna", "Bharat Rao", "Kiran Reddy", "Gurpreet Singh", "Harpreet Kaur", "Jaspreet Singh",
  "Maninder Gill", "Hardeep Sandhu", "Kuldeep Brar", "Navjot Sidhu", "Paramveer Singh", "Rupinder Dhillon",
  "Amritpal Grewal", "Rajveer Rathore", "Vikram Sisodia", "Pratap Chauhan", "Gajendra Shekhawat", "Ajit Rajawat",
  "Lokesh Bhati", "Sohan Parihar", "Mahendra Solanki", "Bhawani Jhala", "Dinesh Tanwar", "Amit Dahiya",
  "Rohit Hooda", "Vikas Malik", "Naveen Jakhar", "Deepak Sangwan", "Ajay Kadian", "Karan Punia", "Mukesh Deswal",
  "Yogesh Phogat", "Parveen Mor", "Ankit Yadav", "Shivam Mishra", "Ayush Pandey", "Vivek Dubey", "Rahul Tripathi",
  "Mohit Srivastava", "Abhishek Shukla", "Aman Bajpai", "Kunal Pathak", "Deepak Awasthi", "Nitish Kumar",
  "Chandan Jha", "Pankaj Thakur", "Mukesh Sinha", "Saurabh Rai", "Gautam Anand", "Manish Ojha", "Rahul Narayan",
  "Sunil Paswan", "Abhay Mandal", "Soumik Banerjee", "Arijit Chatterjee", "Sayan Ghosh", "Debashish Bose",
  "Subrata Das", "Prasenjit Roy", "Tapas Sen", "Kaushik Mitra", "Anirban Dutta", "Souvik Pal", "Satyajit Nayak",
  "Debasis Sahoo", "Prakash Mohanty", "Manas Panda", "Santosh Rout", "Rajesh Pati", "Bikash Swain", "Chandan Jena",
  "Rakesh Behera", "Dillip Samal", "Ritam Bora", "Anup Deka", "Pranab Saikia", "Nayan Gogoi", "Dipak Kalita",
  "Rahul Baruah", "Kaushik Talukdar", "Manas Bhuyan", "Bikram Phukan", "Ajit Bordoloi", "Ravi Soren", "Ajay Murmu",
  "Deepak Hembrom", "Vikash Tudu", "Rajesh Kisku", "Pankaj Marandi", "Nitesh Minz", "Santosh Besra", "Akash Purty",
  "Rohit Mahli", "Mohit Rawat", "Rahul Negi", "Deepak Bisht", "Ankit Nautiyal", "Saurabh Gusain", "Lokesh Kunwar",
  "Pankaj Bhandari", "Ashish Uniyal", "Akash Dhami", "Nitin Bartwal", "Aamir Khan", "Bilal Mir", "Tariq Lone",
  "Adil Bhat", "Sameer Zargar", "Junaid Sofi", "Imran Parray", "Faisal Butt", "Arif Andrabi", "Yasin Malik",
  "Kevin Dsouza", "Ryan Fernandes", "Jason Pinto", "Allan Mascarenhas", "Trevor Almeida", "Aaron Menezes",
  "Joel Sequeira", "Edwin Rebello", "Rohan Correia", "Clive Noronha", "Aryan Malhotra", "Kabir Khanna",
  "Vivaan Arora", "Ishaan Kapoor", "Reyansh Mehra", "Ayaan Sethi", "Dev Batra", "Aryan Oberoi", "Krish Talwar",
  "Laksh Juneja", "Priya Malhotra", "Simran Arora", "Riya Kapoor", "Ananya Khanna", "Kiara Batra", "Myra Talwar",
  "Siya Oberoi", "Meher Juneja", "Aarohi Sethi", "Shanaya Mehra", "Aarav Deshmukh", "Tara Singh", "Aditi Sharma",
  "Shruti Verma", "Shweta Gupta", "Nidhi Patel", "Kiran Desai", "Rekha Joshi", "Sunita Chauhan", "Geeta Shah",
  "Seema Tiwari", "Manju Yadav", "Asha Mishra", "Usha Pandey", "Sarita Reddy", "Poonam Rao", "Neelam Naidu",
  "Kirti Gowda", "Meena Shetty", "Renuka Iyer", "Mamta Menon", "Alka Nair", "Shilpa Pillai", "Sonam Das",
  "Priti Bose", "Richa Roy", "Nita Sen", "Rupa Dutta", "Shalini Banerjee", "Nupur Chatterjee", "Sushma Mukherjee",
  "Kavya Sengupta", "Navya Sahoo", "Ahana Mohanty", "Risha Panda", "Abhinav Nayak", "Bhavin Pradhan", 
  "Chetan Rout", "Darsh Behera", "Eshaan Mahapatra", "Farhan Khan", "Gagan Shaikh", "Hitesh Ali", "Ishan Syed", 
  "Jatin Qureshi", "Karan Ansari", "Lalit Agarwal", "Manan Bansal", "Naman Garg", "Ojas Goyal", "Parth Singhal", 
  "Qasim Mittal", "Rajat Parmar", "Samir Bhatt", "Tushar Trivedi", "Utkarsh Mehra", "Varun Singh", "Wahid Yadav", 
  "Yash Sharma", "Zaid Tiwari", "Aditya Verma", "Bharat Mishra", "Chirag Kumar", "Dhruv Gupta", "Eklavya Singh", 
  "Firoz Jain", "Girish Patel", "Harsh Rao", "Inder Gowda", "Jai Naidu", "Kapil Reddy", "Laxman Shetty", 
  "Madhav Iyer", "Nikhil Menon", "Omkar Nair", "Piyush Pillai", "Rahul Das", "Sahil Bose", "Tanmay Roy", 
  "Utsav Sen", "Vedant Dutta", "Yashwant Banerjee", "Zayn Chatterjee", "Abhijeet Mukherjee", "Brijesh Sengupta", 
  "Chaitanya Sahoo", "Deepesh Mohanty", "Eashan Panda", "Gopal Nayak", "Hemant Pradhan", "Ishant Rout", 
  "Jagat Behera", "Kailash Mahapatra", "Lokesh Thakur", "Mayank Rajput", "Nishant Rathore", "Omprakash Shekhawat", 
  "Pranav Jha", "Rishi Pandey", "Siddharth Dubey", "Tarun Tripathi", "Udit Shukla", "Vibhu Bajpai", 
  "Yuvraj Pathak", "Zubin Awasthi", "Aakarsh Ojha", "Bhuvan Dixit", "Chetan Sharma", "Daksh Verma", "Eshan Gupta", 
  "Garv Singh", "Hrithik Yadav", "Ivaan Tiwari", "Jash Mishra", "Kavish Patel", "Luv Jain", "Mitesh Mehta", 
  "Naitik Shah", "Ojas Joshi", "Pratham Solanki", "Ronit Chauhan", "Shlok Oberoi", "Tejas Juneja", "Udai Sethi", 
  "Viren Mehra", "Yug Deshmukh", "Zian Kadam", "Ameya Shinde", "Bhavesh Pawar", "Chinmay Chavan", "Devesh Kale", 
  "Eknath Jadhav", "Gaurang Bhat", "Harshad Rao", "Ishwar Reddy", "Jayesh Naidu", "Kedar Gowda", "Lalit Shetty", 
  "Milind Iyer", "Ninad Menon", "Omkar Nair", "Prasad Pillai", "Ritesh Das", "Saurabh Bose", "Tushar Roy", 
  "Umesh Sen", "Vilas Dutta", "Yogesh Banerjee", "Avinash Chatterjee", "Bhalchandra Mukherjee", "Chandrakant Sengupta",
  "Dattatray Sahoo", "Eknath Mohanty", "Gajanan Panda", "Hanumant Nayak", "Indrajeet Pradhan", "Jitendra Rout", 
  "Kashinath Behera", "Laxmikant Mahapatra", "Mangesh Thakur", "Nandkumar Rajput", "Prakash Rathore", 
  "Rajendra Shekhawat", "Shrikant Jha", "Tukaram Pandey", "Vasant Dubey", "Yashwant Tripathi", "Arnav Shukla", 
  "Bhavik Bajpai", "Chirag Pathak", "Darshan Awasthi", "Eshwar Ojha", "Gautam Dixit", "Harshvardhan Sharma", 
  "Ishaan Verma", "Jatin Gupta", "Kunal Singh", "Lakshya Yadav", "Manish Tiwari", "Nihar Mishra", "Om Patel", 
  "Parth Jain", "Rishabh Mehta", "Samarth Shah", "Tanmay Joshi", "Utkarsh Solanki", "Vedant Chauhan", "Yash Oberoi",
  "Aaditya Juneja", "Bhavya Sethi", "Chaitanya Mehra", "Divyansh Deshmukh", "Eklavya Kadam", "Gaurav Shinde", 
  "Hemant Pawar", "Ishan Chavan", "Jay Kale", "Kartik Jadhav", "Lakshay Bhat", "Madhav Rao", "Nakul Reddy", 
  "Ojas Naidu", "Pranav Gowda", "Rohan Shetty", "Siddharth Iyer", "Tejas Menon", "Utsav Nair", "Vaibhav Pillai", 
  "Yuvraj Das", "Aayush Bose", "Bhuvnesh Roy", "Chiranjiv Sen", "Deepesh Dutta", "Ekansh Banerjee", 
  "Girish Chatterjee", "Harshil Mukherjee", "Ishrit Sengupta", "Jashn Sahoo", "Krishnav Mohanty", "Lavish Panda", 
  "Moksh Nayak", "Navya Pradhan", "Ojaswi Rout", "Pranshu Behera", "Rachit Mahapatra", "Sahas Thakur", 
  "Taksh Rajput", "Ujjwal Rathore", "Vansh Shekhawat", "Yugant Jha", "Aashish Pandey", "Bhargav Dubey", 
  "Chiranjeevi Tripathi", "Devansh Shukla", "Eashan Bajpai", "Gokul Pathak", "Hridhaan Awasthi", "Ikshit Ojha", 
  "Jivitesh Dixit", "Kashvi Sharma", "Laranya Verma", "Manya Gupta", "Navya Singh", "Ojasvini Yadav", "Pahal Tiwari", 
  "Ridhi Mishra", "Saanvi Patel", "Trisha Jain", "Urvi Mehta", "Vanya Shah", "Yashvi Joshi", "Aadya Solanki", 
  "Bhavna Chauhan", "Charu Oberoi", "Drishti Juneja", "Eva Sethi", "Gargi Mehra", "Heer Deshmukh", "Ishika Kadam", 
  "Jhanvi Shinde", "Kavya Pawar", "Lavanya Chavan", "Meher Kale", "Nishtha Jadhav", "Ojaswi Bhat", "Prisha Rao", 
  "Riya Reddy", "Suhana Naidu", "Tanisha Gowda", "Umika Shetty", "Vaidehi Iyer", "Yashika Menon", "Zara Nair", 
  "Aahana Pillai", "Bhoomi Das", "Chhavi Bose", "Dakshita Roy", "Esha Sen", "Gunjan Dutta", "Hitaishi Banerjee", 
  "Ira Chatterjee", "Jivika Mukherjee", "Kashika Sengupta", "Lipika Sahoo", "Mishka Mohanty", "Niharika Panda", 
  "Oviya Nayak", "Parnika Pradhan", "Roshni Rout", "Shanaya Behera", "Tvisha Mahapatra", "Urvashi Thakur", 
  "Vanya Rajput", "Yukta Rathore", "Zoya Shekhawat", "Aarohi Jha", "Barkha Pandey", "Chetna Dubey", 
  "Dipali Tripathi", "Eshana Shukla", "Gauri Bajpai", "Hiral Pathak", "Ishani Awasthi", "Juhi Ojha", 
  "Kritika Dixit", "Latika Sharma", "Medha Verma", "Nandita Gupta", "Oshini Singh", "Prachi Yadav", 
  "Rachana Tiwari", "Shrishti Mishra", "Tanvi Patel", "Upasana Jain", "Vidhi Mehta", "Yamini Shah", 
  "Zalak Joshi", "Akansha Solanki", "Bhakti Chauhan", "Chanchal Oberoi", "Deeksha Juneja", "Ekta Sethi", 
  "Garima Mehra", "Hema Deshmukh", "Isha Kadam", "Jaya Shinde", "Kajal Pawar", "Lata Chavan", "Maya Kale", 
  "Neha Jadhav", "Oorja Bhat", "Poonam Rao", "Rakhi Reddy", "Sneha Naidu", "Tulsi Gowda", "Usha Shetty", 
  "Vandana Iyer", "Yogita Menon", "Zeba Nair", "Anita Pillai", "Bina Das", "Chitra Bose", "Divya Roy", 
  "Elina Sen", "Geeta Dutta", "Hansa Banerjee", "Indu Chatterjee", "Jyoti Mukherjee", "Kamla Sengupta", 
  "Leela Sahoo", "Meena Mohanty", "Nisha Panda", "Ojasvi Nayak", "Parvati Pradhan", "Radha Rout", "Sita Behera", 
  "Tara Mahapatra", "Uma Thakur", "Veena Rajput", "Yasmin Rathore", "Zeenat Shekhawat", "Amrita Jha", 
  "Bhavani Pandey", "Chandni Dubey", "Deepa Tripathi", "Eshwari Shukla", "Ganga Bajpai", "Harini Pathak", 
  "Indira Awasthi", "Janaki Ojha", "Kalyani Dixit", "Laxmi Sharma", "Malini Verma", "Nalini Gupta", "Omana Singh", 
  "Padma Yadav", "Rajani Tiwari", "Savitri Mishra", "Triveni Patel", "Urmila Jain", "Vasudha Mehta", 
  "Yamuna Shah", "Zohra Joshi", "Aishwarya Solanki", "Bhagwati Chauhan", "Damini Oberoi", "Eshani Juneja", 
  "Gayatri Sethi", "Hemlata Mehra", "Ila Deshmukh", "Jagruti Kadam", "Kasturi Shinde", "Lajwanti Pawar"
];
    let randomName = "";
    let randomFakeId = "";

    // 🎲 0 se 100 ke beech random number
    const chance = Math.random() * 100;

    if (chance <= 90) {
      // 90% CHANCE: List se uthao aur naya ID banao
      randomName = indianNames[Math.floor(Math.random() * indianNames.length)];
      randomFakeId = Math.floor(1000000 + Math.random() * 9000000);
    } else {
      // 10% CHANCE: 3-din purana FakeUser Database se uthao
      const FakeUser = require('../models/FakeUser');
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const fakeUsers = await FakeUser.aggregate([
        { $match: { date: { $lte: threeDaysAgo } } },
        { $sample: { size: 1 } }
      ]);

      if (fakeUsers && fakeUsers.length > 0) {
        randomName = fakeUsers[0].name;
        randomFakeId = fakeUsers[0].userId;
      } else {
        // Fallback
        randomName = indianNames[Math.floor(Math.random() * indianNames.length)];
        randomFakeId = Math.floor(1000000 + Math.random() * 9000000);
      }
    }

    // ==========================================
    // 3. RECORD IN DUMMY TRANSACTION (Topup + Stake)
    // ==========================================
    const DummyTransaction = require('../models/DummyTransaction'); 

    // 🔥 Withdrawal ki tarah yahan bhi Staking dikhane ke liye ID ka pehle topup hona zaroori lagta hai.
    // Toh 1 se 5 din purana fake topup entry backdate kar dete hain.
    const fakeJoinDate = new Date();
    fakeJoinDate.setDate(fakeJoinDate.getDate() - Math.floor(Math.random() * 5 + 1));

    // A. Pehle Fake Topup ki entry (Showcase/Backdated)
    await DummyTransaction.create({
      userId: currentUser.userId,
      generatedId: randomFakeId, 
      amount: 30, // Default $30 Topup
      type: "topup", 
      description: `Node Activated with $30`,
      date: fakeJoinDate
    });

    // B. Ab Fake Stake ki entry (Jo aaj live feed me Staking tab me dikhegi)
    await DummyTransaction.create({
      userId: currentUser.userId,
      generatedId: randomFakeId, 
      amount: stakeAmt, 
      type: "stake", // Make sure aapka frontend is type "stake" ko support karta ho
      description: `Staked ${stakeAmt} CCT for ID #${randomFakeId}`,
      date: new Date() // Current time taaki live dashboard me ekdum top pe aaye
    });

    return res.json({ 
      success: true, 
      generatedId: randomFakeId, 
      name: randomName,
      message: `Promo Stake of ${stakeAmt} CCT simulated successfully for feed.` 
    });

  } catch (err) {
    console.error("Promo Stake Simulation Error:", err);
    res.status(500).json({ message: "Server processing error: " + err.message });
  }
});
// 4. Withdraw CCT Income (50-50 Split Rule)
router.post('/withdraw', authMiddleware, async (req, res) => {
    try {
        const { items, transactionPassword } = req.body;
        const user = await User.findOne({ userId: req.user.userId });

        // 🛑 Role Check
        if (user.role === 'leader') {
            return res.status(403).json({ message: "Withdrawal is restricted for your account status." });
        }

        // 🛑 Wallet Address Check (Profile BEP20)
        if (!user.walletAddress || user.walletAddress.trim() === "") {
            return res.status(400).json({ message: "Please update your wallet address from your profile first." });
        }

        // 🛡️ SECURITY CHECKS
        if (user.transactionPassword.toLowerCase() !== transactionPassword.toLowerCase()) {
            return res.status(400).json({ message: "Invalid Transaction Password" });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No withdrawal items provided." });
        }

        // 💰 CALCULATE TOTAL AMOUNT
        let totalAmt = 0;
        for (let item of items) {
            const amt = Math.floor(parseFloat(item.amount));
            if (amt <= 0) return res.status(400).json({ message: "Invalid amount detected." });
            totalAmt += amt;
        }

        // ✨ MULTIPLE OF 10 & MINIMUM $10 CHECK (Sab mila kar)
        if (totalAmt < 10) {
            return res.status(400).json({ message: "Minimum total withdrawal amount is $10." });
        }
        if (totalAmt % 10 !== 0) {
            return res.status(400).json({ message: `Total withdrawal amount must be in multiples of $10. Your total is $${totalAmt}.` });
        }

        // =========================================================
        // 🔥 STEP 1: PRE-CHECK BALANCES
        // =========================================================
        let simStakingWallet = user.cctStakingIncome || 0;
        let simStakingDirectWallet = user.cctStakingDirectIncome || 0;
        let simStakingLevelWallet = user.cctStakingLevelIncome || 0;
        let simSalaryWallet = user.monthlySalaryWallet || 0; // 🔥 NAYA SALARY WALLET ADD KIYA

        for (let item of items) {
            const amt = Math.floor(parseFloat(item.amount));

            if (item.source === "cct_staking") {
                if (simStakingWallet < amt) return res.status(400).json({ message: "Insufficient Staking ROI Balance." });
                simStakingWallet -= amt;
            } else if (item.source === "cct_direct") {
                if (simStakingDirectWallet < amt) return res.status(400).json({ message: "Insufficient Staking Direct Balance." });
                simStakingDirectWallet -= amt;
            } else if (item.source === "cct_level") {
                if (simStakingLevelWallet < amt) return res.status(400).json({ message: "Insufficient Staking Level Balance." });
                simStakingLevelWallet -= amt;
            } else if (item.source === "monthly_salary") { // 🔥 NAYA SOURCE CHECK
                if (simSalaryWallet < amt) return res.status(400).json({ message: "Insufficient Monthly Salary Balance." });
                simSalaryWallet -= amt;
            } else {
                return res.status(400).json({ message: `Unknown source: ${item.source}` });
            }
        }

        // =========================================================
        // 🔥 STEP 2: ACTUAL DEDUCTION & SPLIT RULE (50-50)
        // =========================================================
        let finalCryptoPending = 0;
        let finalCctAdded = 0;

        for (let item of items) {
            const amt = Math.floor(parseFloat(item.amount));
            let descriptionName = "";

            // Wallet Minus
            if (item.source === "cct_staking") {
                user.cctStakingIncome -= amt;
                descriptionName = "Staking ROI Income";
            } else if (item.source === "cct_direct") {
                user.cctStakingDirectIncome -= amt;
                descriptionName = "Staking Direct Income";
            } else if (item.source === "cct_level") {
                user.cctStakingLevelIncome -= amt;
                descriptionName = "Staking Level Income";
            } else if (item.source === "monthly_salary") { // 🔥 SALARY WALLET DEDUCTION
                user.monthlySalaryWallet -= amt;
                descriptionName = "Monthly Salary Income";
            }

            // 💎 50-50 SPLIT RULE (Same for all)
            const cryptoWithdrawShare = amt * 0.50; // Admin panel jayega
            const cctWalletShare = amt * 0.50;      // Instant CCT wallet me jayega

            // 🛑 10% FEE
            const cryptoWithdrawFee = cryptoWithdrawShare * 0.10;
            const cctWalletFee = cctWalletShare * 0.10;

            const netCryptoWithdraw = cryptoWithdrawShare - cryptoWithdrawFee; 
            const netCctWallet = cctWalletShare - cctWalletFee;                

            // Overall Tracker
            finalCryptoPending += netCryptoWithdraw;
            finalCctAdded += netCctWallet;

            // Instant Add to Main Wallet
            user.cctBalance = (user.cctBalance || 0) + netCctWallet;
            user.totalWithdrawn = (user.totalWithdrawn || 0) + amt;

            // Database Entry - Withdrawal List
            await Withdrawal.create({
                userId: user.userId,
                source: item.source, 
                grossAmount: cryptoWithdrawShare,
                fee: cryptoWithdrawFee, 
                netAmount: netCryptoWithdraw,
                walletAddress: user.walletAddress, 
                status: "pending",
                date: new Date()
            });

            // Database Entry - History (Pending Crypto)
            await Transaction.create({
                userId: user.userId, type: 'withdrawal', source: item.source, amount: cryptoWithdrawShare, 
                status: 'pending', description: `Pending Withdrawal from ${descriptionName}`
            });

            // Database Entry - History (Instant CCT Add)
            await Transaction.create({
                userId: user.userId, type: 'credit', source: "system", amount: netCctWallet, 
                status: 'success', description: `CCT Wallet Credit from ${descriptionName} (after 10% fee)`
            });
        }

        await user.save();

        res.json({ 
            success: true, 
            message: `Withdrawal request submitted! $${finalCryptoPending.toFixed(2)} is pending for payout, and ${finalCctAdded.toFixed(2)} CCT added to your Wallet.` 
        });

    } catch (err) {
        console.error("CCT Withdraw Error:", err);
        res.status(500).json({ message: 'Server processing error.' });
    }
});
module.exports = router;