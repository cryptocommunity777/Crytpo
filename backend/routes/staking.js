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
                cctStakingDirectIncome: user.cctStakingDirectIncome || 0, // 🔥 ADD KIYA
                cctStakingLevelIncome: user.cctStakingLevelIncome || 0,   // 🔥 ADD KIYA
                totalCctStaked: user.totalCctStaked || 0,
                stakedMaxCap: user.stakedMaxCap || 0,
                stakedEarned: user.stakedEarned || 0,
                isStaked: user.isStaked || false
            }
        });
    } catch (err) {
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
                message: "You are not allowed to stake on your own ID." 
            });
        }

        // 🛑 RULE 3: 15-DAY TIME LIMIT CHECK
        const STAKING_START_DATE = new Date("2026-07-01T00:01:00+05:30");
        const STAKING_WINDOW_DAYS = 15;
        const userTopUpDate = targetUser.topUpDate || targetUser.createdAt; 
        
        let stakingDeadline;
        if (userTopUpDate < STAKING_START_DATE) {
            stakingDeadline = new Date(STAKING_START_DATE.getTime() + (STAKING_WINDOW_DAYS * 24 * 60 * 60 * 1000));
        } else {
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

        // =======================================================
        // 🔥 FIX: CORRECT CCT DEDUCTION LOGIC
        // =======================================================
        if (String(user.userId) === String(targetUser.userId)) {
            // Case 1: Agar user KHUD ki ID par stake kar raha hai
            targetUser.cctBalance -= stakeAmt;
            targetUser.isStaked = true;
            targetUser.totalCctStaked = stakeAmt;
            targetUser.stakedMaxCap = maxCap;
            targetUser.stakedEarned = 0;
            await targetUser.save();
        } else {
            // Case 2: Agar user KISI AUR ki ID par stake kar raha hai
            user.cctBalance -= stakeAmt;
            await user.save(); 

            targetUser.isStaked = true;
            targetUser.totalCctStaked = stakeAmt;
            targetUser.stakedMaxCap = maxCap;
            targetUser.stakedEarned = 0;
            await targetUser.save();
        }

        await Transaction.create({
            userId: user.userId, type: 'cct_stake_send', amount: stakeAmt, status: 'success',
            description: `Staked ${stakeAmt} CCT for ID #${targetUser.userId}`, date: new Date()
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
                        const calculationAmount = Math.min(sponsor.totalCctStaked || 0, stakeAmt);
                        const STAKING_DIRECT_PERCENT = 10; 
                        const directBonus = (calculationAmount * STAKING_DIRECT_PERCENT) / 100; 

                        if (directBonus > 0) {
                            sponsor.cctStakingDirectIncome = (sponsor.cctStakingDirectIncome || 0) + directBonus;
                            await sponsor.save();

                            await Transaction.create({
                                userId: sponsor.userId, type: "staking_direct_income", source: "cct_direct", amount: directBonus, 
                                fromUserId: targetUser.userId,
                                description: `Direct Bonus (10%) from ${targetUser.name}'s Stake (Calculated on Capped Amt: ${calculationAmount} CCT)`, 
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
                        if (upline.isToppedUp && upline.isStaked) {
                            const percentage = LEVEL_PERCENTAGES[currentLevel - 1];
                            const calculationAmount = Math.min(upline.totalCctStaked || 0, stakeAmt);
                            const levelBonus = (calculationAmount * percentage) / 100;

                            if (levelBonus > 0) {
                                await User.updateOne(
                                    { _id: upline._id }, 
                                    { $inc: { cctStakingLevelIncome: levelBonus } }
                                );

                                await Transaction.create({
                                    userId: upline.userId, type: "staking_level_income", source: "cct_level", amount: levelBonus,
                                    fromUserId: targetUser.userId, 
                                    description: `Level ${currentLevel} Staking Income (${percentage}%) from ${targetUser.name}`, 
                                    status: 'success', date: new Date()
                                });
                            }
                        }
                    }

                    // ============================================
                    // B. LEADER BREAKAWAY BONUS 5% LOGIC
                    // ============================================
                    if (currentLevel >= 2 && isCurrentUplineLeader && !leaderBonusGiven) {
                        if (upline.isToppedUp) {
                            const effectiveAmount = upline.totalCctStaked > 0 
                                ? Math.min(upline.totalCctStaked, stakeAmt) 
                                : stakeAmt; 

                            const leaderBonusAmount = (effectiveAmount * 5) / 100; 
                            
                            if (leaderBonusAmount > 0) {
                                await User.updateOne(
                                    { _id: upline._id }, 
                                    { $inc: { cctBalance: leaderBonusAmount } }
                                );
                                
                                await Transaction.create({
                                    userId: upline.userId, type: "credit", source: "system", amount: leaderBonusAmount,
                                    fromUserId: targetUser.userId, 
                                    description: `5% Instant Leader Staking Bonus (No Stake Req.) added to CCT Wallet (Level ${currentLevel})`,
                                    status: "success", date: new Date()
                                });
                            }
                        }
                        
                        // Breakaway hit! 
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
            }

            // 💎 50-50 SPLIT RULE
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