// const cron = require('node-cron');
// const User = require('../models/User'); 
// const Transaction = require('../models/Transaction');

// const startStakingCron = () => {
//     // Har raat 12:30 AM IST par chalega
//     cron.schedule('30 0 * * *', async () => {
//         try {
//             console.log("⏳ [CRON] Running CCT Staking Daily Distribution (Updated Multi-Stake)...");
            
//             // Unko dhoondo jinka isStaked true hai
//             const stakedUsers = await User.find({ isStaked: true });

//             if (stakedUsers.length === 0) {
//                 console.log("✅ [CRON] No eligible users found for Staking Payout today.");
//                 return;
//             }

//             let successCount = 0;

//             for (let user of stakedUsers) {
//                 // =========================================================
//                 // 🔹 SAFETY MIGRATION: Agar purana user hai jiska array nahi bana, 
//                 // toh cron khud uska purana data array mein shift kar dega.
//                 // =========================================================
//                 if ((!user.activeStakes || user.activeStakes.length === 0) && user.totalCctStaked > 0) {
//                     user.activeStakes = [{
//                         amount: user.totalCctStaked,
//                         maxCap: user.stakedMaxCap,
//                         earned: user.stakedEarned || 0,
//                         dailyRate: user.stakingDailyRate || 1.0,
//                         createdAt: user.createdAt || new Date(),
//                         status: (user.stakedEarned >= user.stakedMaxCap) ? 'completed' : 'active'
//                     }];
//                 }

//                 // Agar array khali hai aur data nahi hai, toh isStaked false karke aage badho
//                 if (!user.activeStakes || user.activeStakes.length === 0) {
//                     user.isStaked = false;
//                     await user.save();
//                     continue;
//                 }

//                 let totalDailyPayout = 0;
//                 let hasActiveStakes = false;

//                 // =========================================================
//                 // 🔹 HAR STAKE KO ALAG SE CHECK KARNA (Naye Rates Support Ke Sath)
//                 // =========================================================
//                 for (let stake of user.activeStakes) {
//                     // Agar ye wala stake poora ho gaya hai, toh skip karo
//                     if (stake.status === 'completed' || stake.earned >= stake.maxCap) {
//                         stake.status = 'completed';
//                         continue;
//                     }

//                     // 🔥 NAYA FIX: Database se rate uthayega (1, 1.5, 2, or 2.5)
//                     const ratePercent = Number(stake.dailyRate) || 1.0;
//                     const dailyIncome = stake.amount * (ratePercent / 100); 

//                     // Pura rate milega ya bacha hua cap? (Limit check)
//                     const remainingCap = stake.maxCap - stake.earned;
//                     const actualPayout = dailyIncome > remainingCap ? remainingCap : dailyIncome;

//                     if (actualPayout > 0) {
//                         stake.earned += actualPayout;
//                         totalDailyPayout += actualPayout;
                        
//                         // Agar is stake ne apni Maximum Cap (3x) achieve kar li hai
//                         if (stake.earned >= stake.maxCap) {
//                             stake.status = 'completed';
//                         } else {
//                             hasActiveStakes = true; // Stake abhi bhi chal raha hai
//                         }
//                     }
//                 }

//                 // =========================================================
//                 // 🔹 FINAL GLOBAL UPDATES & TRANSACTION
//                 // =========================================================
//                 if (totalDailyPayout > 0) {
//                     // UI ke boxes ke liye global stats update
//                     user.cctStakingIncome = (user.cctStakingIncome || 0) + totalDailyPayout;
//                     user.stakedEarned = (user.stakedEarned || 0) + totalDailyPayout;
                    
//                     // Agar saare stakes pure ho gaye, toh aage ke liye band kar do
//                     if (!hasActiveStakes) {
//                         user.isStaked = false;
//                     }

//                     // 🔥 IMPORTANT: Array update karne par Mongoose ko manually batana padta hai
//                     user.markModified('activeStakes');
//                     await user.save();

//                     // Ek user ko ek hi transaction jayegi, jisme sab stakes ka total hoga
//                     await Transaction.create({
//                         userId: user.userId, 
//                         type: 'cct_staking_income', 
//                         source: 'staking',
//                         amount: totalDailyPayout, 
//                         status: 'success',
//                         description: `Daily CCT Staking Income (Aggregated from all active stakes).`, 
//                         date: new Date()
//                     });

//                     successCount++;
//                 } else if (!hasActiveStakes && user.isStaked) {
//                     // Agar payout 0 bani aur koi stake active nahi hai
//                     user.isStaked = false;
//                     user.markModified('activeStakes');
//                     await user.save();
//                 }
//             }
            
//             console.log(`✅ [CRON] Staking Payout successfully distributed to ${successCount} users.`);
//         } catch (err) {
//             console.error("❌ [CRON] Staking Cron Error:", err);
//         }
//     }, {
//         scheduled: true,
//         timezone: "Asia/Kolkata" // Hamesha IST ke hisaab se chalega
//     });
// };

// module.exports = startStakingCron;

const cron = require('node-cron');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');

const startStakingCron = () => {
    // 🔥 TEMPORARY TIME: Aaj 13:35 (1:35 PM IST) par chalane ke liye set kiya hai
    // Note: Jab ye aaj chal jaye, toh kal se wapas '30 0 * * *' (12:30 AM) kar dena
    cron.schedule('35 13 * * *', async () => {
        try {
            console.log("⏳ [CRON] Running CCT Staking Daily Distribution (Updated Multi-Stake & Safe Mode)...");
            
            // 1. 🔥 INDIA TIMEZONE FIX FOR "TODAY" MIDNIGHT
            // Yeh check karne ke liye ki aaj ke din payout gaya hai ya nahi
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
            const startOfTodayIST = new Date(`${year}-${month}-${day}T00:00:00+05:30`);

            // Unko dhoondo jinka isStaked true hai
            const stakedUsers = await User.find({ isStaked: true });

            if (stakedUsers.length === 0) {
                console.log("✅ [CRON] No eligible users found for Staking Payout today.");
                return;
            }

            let successCount = 0;
            let skippedCount = 0;

            for (let user of stakedUsers) {
                
                // =========================================================
                // 🛑 DOUBLE PAYMENT PROTECTION (MASTERSTROKE)
                // Check karo kya is user ko aaj payout mil chuka hai?
                // =========================================================
                const alreadyPaidToday = await Transaction.findOne({
                    userId: user.userId,
                    type: 'cct_staking_income',
                    date: { $gte: startOfTodayIST } // Aaj raat 12 baje ke baad ki transaction
                });

                if (alreadyPaidToday) {
                    // Agar aaj ki entry mil gayi, toh is user ko chhod do
                    skippedCount++;
                    continue; 
                }

                // =========================================================
                // 🔹 SAFETY MIGRATION: Agar purana user hai jiska array nahi bana
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
                // 🔹 HAR STAKE KO ALAG SE CHECK KARNA (Naye Rates Support Ke Sath)
                // =========================================================
                for (let stake of user.activeStakes) {
                    if (stake.status === 'completed' || stake.earned >= stake.maxCap) {
                        stake.status = 'completed';
                        continue;
                    }

                    const ratePercent = Number(stake.dailyRate) || 1.0;
                    const dailyIncome = stake.amount * (ratePercent / 100); 

                    const remainingCap = stake.maxCap - stake.earned;
                    const actualPayout = dailyIncome > remainingCap ? remainingCap : dailyIncome;

                    if (actualPayout > 0) {
                        stake.earned += actualPayout;
                        totalDailyPayout += actualPayout;
                        
                        if (stake.earned >= stake.maxCap) {
                            stake.status = 'completed';
                        } else {
                            hasActiveStakes = true; 
                        }
                    }
                }

                // =========================================================
                // 🔹 FINAL GLOBAL UPDATES & TRANSACTION
                // =========================================================
                if (totalDailyPayout > 0) {
                    user.cctStakingIncome = (user.cctStakingIncome || 0) + totalDailyPayout;
                    user.stakedEarned = (user.stakedEarned || 0) + totalDailyPayout;
                    
                    if (!hasActiveStakes) {
                        user.isStaked = false;
                    }

                    user.markModified('activeStakes');
                    await user.save();

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
                    user.isStaked = false;
                    user.markModified('activeStakes');
                    await user.save();
                }
            }
            
            console.log(`✅ [CRON] Staking Payout successfully distributed to ${successCount} users. (Skipped ${skippedCount} users to prevent double payment).`);
        } catch (err) {
            console.error("❌ [CRON] Staking Cron Error:", err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" 
    });
};

module.exports = startStakingCron;