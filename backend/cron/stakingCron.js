// backend/cron/stakingCron.js
const cron = require('node-cron');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');

const startStakingCron = () => {
    // Har raat 12:10 AM IST par chalega
cron.schedule('30 0 * * *', async () => {
                try {
            console.log("⏳ [CRON] Running CCT Staking Daily 1% Distribution...");
            
            // Unko dhoondo jinka isStaked true hai aur earned cap se kam hai
            const stakedUsers = await User.find({ 
                isStaked: true, 
                $expr: { $lt: ["$stakedEarned", "$stakedMaxCap"] } 
            });

            if (stakedUsers.length === 0) {
                console.log("✅ [CRON] No eligible users found for Staking Payout today.");
                return;
            }

            let successCount = 0;

            for (let user of stakedUsers) {
                const dailyIncome = user.totalCctStaked * 0.01; // 1% of staked amount

                // Pura 1% milega ya bacha hua cap? (Limit check)
                const remainingCap = user.stakedMaxCap - user.stakedEarned;
                const actualPayout = dailyIncome > remainingCap ? remainingCap : dailyIncome;

                if (actualPayout <= 0) continue;

                user.cctStakingIncome = (user.cctStakingIncome || 0) + actualPayout;
                user.stakedEarned = (user.stakedEarned || 0) + actualPayout;
                
                // Agar Max Cap tak pohoch gaya, toh aage ke liye stake complete maan lo
                if (user.stakedEarned >= user.stakedMaxCap) {
                    user.isStaked = false; // Cap reach ho gaya, ab aur nahi milega jab tak naya stake na kare
                }

                await user.save();

                await Transaction.create({
                    userId: user.userId, 
                    type: 'cct_staking_income', 
                    source: 'staking',
                    amount: actualPayout, 
                    status: 'success',
                    description: `Daily 1% CCT Staking Income based on ${user.totalCctStaked} CCT Staked.`, 
                    date: new Date()
                });

                successCount++;
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