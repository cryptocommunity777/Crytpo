const cron = require('node-cron');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');

const startStakingCron = () => {
    // Har raat 12:30 AM IST par chalega
    cron.schedule('30 0 * * *', async () => {
        try {
            console.log("⏳ [CRON] Running CCT Staking Daily Distribution (Multi-Stake)...");
            
            // Unko dhoondo jinka isStaked true hai
            const stakedUsers = await User.find({ isStaked: true });

            if (stakedUsers.length === 0) {
                console.log("✅ [CRON] No eligible users found for Staking Payout today.");
                return;
            }

            let successCount = 0;

            for (let user of stakedUsers) {
                // =========================================================
                // 🔹 SAFETY MIGRATION: Agar purana user hai jiska array nahi bana, 
                // toh cron khud uska purana data array mein shift kar dega.
                // =========================================================
                if ((!user.activeStakes || user.activeStakes.length === 0) && user.totalCctStaked > 0) {
                    user.activeStakes = [{
                        amount: user.totalCctStaked,
                        maxCap: user.stakedMaxCap,
                        earned: user.stakedEarned || 0,
                        dailyRate: user.stakingDailyRate || 1.0,
                        createdAt: user.createdAt || new Date(),
                        status: (user.stakedEarned >= user.stakedMaxCap) ? 'completed' : 'active'
                    }];
                }

                // Agar array khali hai aur data nahi hai, toh isStaked false karke aage badho
                if (!user.activeStakes || user.activeStakes.length === 0) {
                    user.isStaked = false;
                    await user.save();
                    continue;
                }

                let totalDailyPayout = 0;
                let hasActiveStakes = false;

                // =========================================================
                // 🔹 HAR STAKE KO ALAG SE CHECK KARNA AUR PAYOUT DENA
                // =========================================================
                for (let stake of user.activeStakes) {
                    // Agar ye wala stake poora ho gaya hai, toh skip karo
                    if (stake.status === 'completed' || stake.earned >= stake.maxCap) {
                        stake.status = 'completed';
                        continue;
                    }

                    // Apne-apne rate ke hisaab se calculation (1% ya 0.5%)
                    const ratePercent = stake.dailyRate || 1.0;
                    const dailyIncome = stake.amount * (ratePercent / 100); 

                    // Pura rate milega ya bacha hua cap? (Limit check)
                    const remainingCap = stake.maxCap - stake.earned;
                    const actualPayout = dailyIncome > remainingCap ? remainingCap : dailyIncome;

                    if (actualPayout > 0) {
                        stake.earned += actualPayout;
                        totalDailyPayout += actualPayout;
                        
                        // Agar is stake ne apni Maximum Cap achieve kar li hai
                        if (stake.earned >= stake.maxCap) {
                            stake.status = 'completed';
                        } else {
                            hasActiveStakes = true; // Stake abhi bhi chal raha hai
                        }
                    }
                }

                // =========================================================
                // 🔹 FINAL GLOBAL UPDATES & TRANSACTION
                // =========================================================
                if (totalDailyPayout > 0) {
                    // UI ke 6 boxes ke liye global stats update
                    user.cctStakingIncome = (user.cctStakingIncome || 0) + totalDailyPayout;
                    user.stakedEarned = (user.stakedEarned || 0) + totalDailyPayout;
                    
                    // Agar saare stakes pure ho gaye, toh aage ke liye band kar do
                    if (!hasActiveStakes) {
                        user.isStaked = false;
                    }

                    // 🔥 IMPORTANT: Array update karne par Mongoose ko manually batana padta hai
                    user.markModified('activeStakes');
                    await user.save();

                    // Ek user ko ek hi transaction jayegi, jisme sab stakes ka total hoga
                    await Transaction.create({
                        userId: user.userId, 
                        type: 'cct_staking_income', 
                        source: 'staking',
                        amount: totalDailyPayout, 
                        status: 'success',
                        description: `Daily CCT Staking Income (Aggregated from all active stakes).`, 
                        date: new Date()
                    });

                    successCount++;
                } else if (!hasActiveStakes && user.isStaked) {
                    // Agar payout 0 bani aur koi stake active nahi hai
                    user.isStaked = false;
                    user.markModified('activeStakes');
                    await user.save();
                }
            }
            
            console.log(`✅ [CRON] Staking Payout successfully distributed to ${successCount} users.`);
        } catch (err) {
            console.error("❌ [CRON] Staking Cron Error:", err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Hamesha IST ke hisaab se chalega
    });
};

module.exports = startStakingCron;