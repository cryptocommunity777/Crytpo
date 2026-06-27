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
        const user = await User.findOne({ userId: req.user.userId }).select('walletBalance cctBalance cctStakingIncome totalCctStaked stakedMaxCap stakedEarned isStaked');
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
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

// 3. Stake CCT (Self or Downline)
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

        // 🛑 RULE 1: MUST BE TOPPED UP ($30 ACTIVE ID)
        if (!targetUser.isToppedUp) {
            return res.status(400).json({ message: "Target ID must be Active (Topped Up) to participate in Staking." });
        }

        // 🛑 RULE 2: ONLY 1 STAKE AT A TIME
        if (targetUser.isStaked) {
            return res.status(400).json({ 
                message: "Staking is already active on this ID. You cannot stake again until the current staking max cap is fully achieved." 
            });
        }

        // 🛑 RULE 4: LEADER CANNOT STAKE ON THEIR OWN ID
        if (targetUser.role === 'leader' && String(targetUser.userId) === String(user.userId)) {
            return res.status(403).json({ 
                message: "You are not allowed to stake on their own ID." 
            });
        }

        // 🛑 RULE 3: 15-DAY TIME LIMIT CHECK (Starts from 28 June 2026 IST)
        const STAKING_START_DATE = new Date("2026-06-28T00:00:00+05:30"); 
        const STAKING_WINDOW_DAYS = 15;
        const userTopUpDate = targetUser.topUpDate || targetUser.createdAt; 
        
        let stakingDeadline;
        if (userTopUpDate < STAKING_START_DATE) {
            // Purane users ko 28 June se 15 din milenge
            stakingDeadline = new Date(STAKING_START_DATE.getTime() + (STAKING_WINDOW_DAYS * 24 * 60 * 60 * 1000));
        } else {
            // Naye users ko unke Top-up date se 15 din milenge
            stakingDeadline = new Date(userTopUpDate.getTime() + (STAKING_WINDOW_DAYS * 24 * 60 * 60 * 1000));
        }

        if (new Date() > stakingDeadline) {
            return res.status(400).json({ message: "Your 15-day window for staking has expired." });
        }

        // 🔹 MAX CAP CALCULATION
        let maxCap = 0;
        if (stakeAmt >= 100 && stakeAmt <= 499) maxCap = stakeAmt * 3;
        else if (stakeAmt >= 500 && stakeAmt <= 999) maxCap = stakeAmt * 4;
        else if (stakeAmt >= 1000 && stakeAmt <= 1999) maxCap = stakeAmt * 5;

        // 🔹 DEDUCT FROM SENDER & APPLY TO TARGET
        user.cctBalance -= stakeAmt;
        if (user.userId !== targetUser.userId) await user.save(); 

        targetUser.isStaked = true;
        targetUser.totalCctStaked = stakeAmt;
        targetUser.stakedMaxCap = maxCap;
        targetUser.stakedEarned = 0;
        await targetUser.save();

        await Transaction.create({
            userId: user.userId, type: 'cct_stake_send', amount: stakeAmt, status: 'success',
            description: `Staked ${stakeAmt} CCT for ID #${targetUser.userId}`, date: new Date()
        });

        // =======================================================
        // 🔥 BACKGROUND MLM ENGINE FOR STAKING (WITH BREAKAWAY)
        // =======================================================
        (async () => {
            try {
                // ✅ 1. DIRECT INCOME LOGIC (25% WITH CAPPING)
                if (targetUser.sponsorId) {
                    const sponsor = await User.findOne({ userId: targetUser.sponsorId });
                    
                    if (sponsor && sponsor.isToppedUp && sponsor.isStaked) {
                        // 🔥 CAPPING RULE: Jo amount chota hoga (Sponsor ka Stake ya Downline ka Stake), us par percentage niklegi
                        const calculationAmount = Math.min(sponsor.totalCctStaked || 0, stakeAmt);
                        
                        const STAKING_DIRECT_PERCENT = 10; // 10% Direct Income
                        const directBonus = (calculationAmount * STAKING_DIRECT_PERCENT) / 100; 

                        if (directBonus > 0) {
                            sponsor.cctStakingIncome = (sponsor.cctStakingIncome || 0) + directBonus;
                            await sponsor.save();

                            await Transaction.create({
                                userId: sponsor.userId, type: "staking_direct_income", source: "direct", amount: directBonus, 
                                fromUserId: targetUser.userId,
                                description: `Direct Bonus (25%) from ${targetUser.name}'s Stake (Calculated on Capped Amt: ${calculationAmount} CCT)`, 
                                status: 'success', date: new Date()
                            });
                        }
                    } else if (sponsor) {
                        console.log(`[FLUSHED] Staking Direct Income flushed. Sponsor ${sponsor.userId} is Inactive or NOT Staked.`);
                    }
                }

                // ✅ 2. UNIFIED 100-LEVEL ENGINE (LEVEL INCOME + LEADER BREAKAWAY)
                const LEVEL_PERCENTAGES = [0, 5, 3, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
                let currentUplineId = targetUser.sponsorId; 
                let currentLevel = 1;

                while (currentUplineId && currentLevel <= 100) {
                    const upline = await User.findOne({ userId: currentUplineId }).select('userId isToppedUp isStaked sponsorId role totalCctStaked');
                    if (!upline) break;

                    const isCurrentUplineLeader = (upline.role === 'leader');

                    // ============================================
                    // A. NORMAL LEVEL INCOME LOGIC (Level 2 se 20 tak)
                    // ============================================
                    if (currentLevel >= 2 && currentLevel <= 20) {
                        if (upline.isToppedUp && upline.isStaked) {
                            const percentage = LEVEL_PERCENTAGES[currentLevel - 1];
                            
                            // 🔥 CAPPING RULE APPLIED FOR LEVEL INCOME
                            const calculationAmount = Math.min(upline.totalCctStaked || 0, stakeAmt);
                            const levelBonus = (calculationAmount * percentage) / 100;

                            if (levelBonus > 0) {
                                await User.updateOne(
                                    { _id: upline._id }, 
                                    { $inc: { cctStakingIncome: levelBonus } }
                                );

                                await Transaction.create({
                                    userId: upline.userId, type: "staking_level_income", source: "level", amount: levelBonus,
                                    fromUserId: targetUser.userId, 
                                    description: `Level ${currentLevel} Staking Income (${percentage}%) from ${targetUser.name} on Capped Amt: ${calculationAmount} CCT`, 
                                    status: 'success', date: new Date()
                                });
                            }
                        } else {
                            console.log(`[FLUSHED] Staking Level ${currentLevel} income flushed for Upline ${upline.userId} (Inactive/Unstaked).`);
                        }
                    }

                    // ============================================
                    // B. LEADER BREAKAWAY BONUS 5% LOGIC (Level 2 to 100)
                    // ============================================
                    if (currentLevel >= 2 && isCurrentUplineLeader) {
                        // Leader ko tabhi milega jab wo khud Active aur Staked ho
                        if (upline.isToppedUp && upline.isStaked) {
                            
                            // 🔥 CAPPING RULE APPLIED FOR LEADER BONUS
                            const calculationAmount = Math.min(upline.totalCctStaked || 0, stakeAmt);
                            const leaderBonusAmount = (calculationAmount * 5) / 100; // 5% Leader Staking Bonus
                            
                            if (leaderBonusAmount > 0) {
                                await User.updateOne(
                                    { _id: upline._id }, 
                                    { $inc: { cctStakingIncome: leaderBonusAmount } }
                                );
                                
                                await Transaction.create({
                                    userId: upline.userId, type: "staking_leader_bonus", source: "leader_bonus", amount: leaderBonusAmount,
                                    fromUserId: targetUser.userId, 
                                    description: `5% Leader Staking Bonus from Downline (Level ${currentLevel}) on Capped Amt: ${calculationAmount} CCT`,
                                    status: "success", date: new Date()
                                });
                            }
                        } else {
                            console.log(`[FLUSHED] Leader Bonus flushed. Leader ${upline.userId} is Inactive or NOT Staked.`);
                        }

                        // 🔥 THE ULTIMATE LEADER BREAKAWAY WALL 🔥
                        // Chahe leader ko paisa mila ho ya flush hua ho, chain yahi block ho jayegi!
                        console.log(`[STAKING MLM ENGINE] Breakaway hit at Leader ${upline.userId} (Level ${currentLevel}). Distribution stopped.`);
                        break; 
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

// 4. Withdraw CCT Income (50-50 Split Rule)
// 4. Withdraw CCT Income (50% Re-Stake, 50% Pending Withdrawal for Admin)
router.post('/withdraw', authMiddleware, async (req, res) => {
    try {
        const { amount, transactionPassword } = req.body;
        const user = await User.findOne({ userId: req.user.userId });

        // 🛡️ BASIC SECURITY CHECKS
        if (user.transactionPassword.toLowerCase() !== transactionPassword.toLowerCase()) {
            return res.status(400).json({ message: "Invalid Transaction Password" });
        }
        if (amount < 10) {
            return res.status(400).json({ message: "Minimum withdrawal is $10" });
        }
        if (amount % 10 !== 0) {
            return res.status(400).json({ message: `Withdrawal amount must be in multiples of $10. Your amount is $${amount}.` });
        }
        if (user.cctStakingIncome < amount) {
            return res.status(400).json({ message: "Insufficient Staking Income" });
        }

        const withdrawAmt = Number(amount);
        
        // 💎 50-50 SPLIT RULE
        const cryptoWithdrawShare = withdrawAmt * 0.50; // 50% withdrawal request (Admin ke paas jayega)
        const cctWalletShare = withdrawAmt * 0.50;      // 50% instant CCT wallet me jayega

        // 🛑 10% FEE ON BOTH
        const cryptoWithdrawFee = cryptoWithdrawShare * 0.10;
        const cctWalletFee = cctWalletShare * 0.10;

        const netCryptoWithdraw = cryptoWithdrawShare - cryptoWithdrawFee; // User ko account/crypto me receive hoga
        const netCctWallet = cctWalletShare - cctWalletFee;                // CCT balance me add hoga

        // =========================================================
        // 🔥 REAL DEDUCTION & DATABASE RECORDS
        // =========================================================

        // 1. Deduct full requested amount from CCT Staking Income
        user.cctStakingIncome -= withdrawAmt;
        
        // 2. Add 50% (after fee) to CCT Balance instantly
        user.cctBalance += netCctWallet; 
        user.totalWithdrawn = (user.totalWithdrawn || 0) + withdrawAmt; // Total tracker update kiya

        // 3. Create Pending Withdrawal Record for Admin (Admin panel me dikhega)
        await Withdrawal.create({
            userId: user.userId,
            source: "cct_staking", // Source alag rakha hai taaki admin ko pata chale staking ka paisa hai
            grossAmount: cryptoWithdrawShare,
            fee: cryptoWithdrawFee, 
            netAmount: netCryptoWithdraw,
            walletAddress: user.walletAddress || "Not Provided",
            status: "pending",
            date: new Date()
        });

        // 4. Create Transaction Log for Pending Withdrawal
        await Transaction.create({
            userId: user.userId, 
            type: 'withdrawal', 
            source: "cct_staking",
            amount: cryptoWithdrawShare, 
            status: 'pending',
            description: `Pending Withdrawal from CCT Staking Income`
        });

        // 5. Create Transaction Log for CCT Credit
        await Transaction.create({
            userId: user.userId, 
            type: 'credit', 
            source: "system",
            amount: netCctWallet, 
            status: 'success',
            description: `CCT Wallet Credit from Staking Income (after 10% fee)`
        });

        await user.save();

        res.json({ 
            success: true, 
            message: `Withdrawal request submitted! $${netCryptoWithdraw} is pending for payout, and ${netCctWallet} CCT added to your CCT Wallet.` 
        });

    } catch (err) {
        console.error("CCT Withdraw Error:", err);
        res.status(500).json({ message: 'Server processing error.' });
    }
});

module.exports = router;