const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// 🔹 HELPER FUNCTION: Leader ki team ka aaj ka business nikalna
async function calculateTodayTeamBusiness(leaderId, startOfToday, endOfToday) {
    let totalBusiness = 0;
    
    // Level 1 (Directs) se shuru karenge
    let currentLevelUsers = await User.find({ sponsorId: leaderId });

    while (currentLevelUsers.length > 0) {
        let nextLevelIds = [];
        
        for (let u of currentLevelUsers) {
            // Check: Kya is bande ne AAJ topup kiya hai?
            if (u.isToppedUp && u.topUpDate >= startOfToday && u.topUpDate <= endOfToday) {
                totalBusiness += (u.topUpAmount || 0);
            }
            // Iski downline nikalne ke liye ID save karo
            nextLevelIds.push(u.userId);
        }
        
        // Agle level ke users find karo
        currentLevelUsers = await User.find({ sponsorId: { $in: nextLevelIds } });
    }
    
    return totalBusiness;
}

// =======================================================
// 🚀 CRON JOB: Daily raat 11:59 PM par chalega
// =======================================================
const runDailyLeaderClosing = () => {
    // Cron Format: '59 23 * * *' means 23:59 (11:59 PM) every day
    cron.schedule('59 23 * * *', async () => {
        console.log("🕒 [CRON] Starting Daily 10% Leader Closing...");

        try {
            // Aaj ka waqt (Start & End)
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            // 1. Sirf 'leader' role wale users ko nikalo
            const leaders = await User.find({ role: 'leader' });

            for (const leader of leaders) {
                // 2. Is leader ki team ka AAJ ka total business nikalo
                const todayBusiness = await calculateTodayTeamBusiness(leader.userId, startOfToday, endOfToday);

                if (todayBusiness > 0) {
                    // 3. 10% Calculate karo
                    const bonusAmount = (todayBusiness * 10) / 100;

                    // 4. Leader ke ASLI WALLET me add karo (Taaki wo ise use/transfer kar sake)
                    leader.walletBalance = (leader.walletBalance || 0) + bonusAmount;
                    
                    // Agar leader income track karni hai toh schema me add kar sakte ho (optional)
                    leader.rewardIncome = (leader.rewardIncome || 0) + bonusAmount;
                    leader.totalRewardIncome = (leader.totalRewardIncome || 0) + bonusAmount;
                    
                    await leader.save();

                    // 5. Transaction History me entry karo
                    await Transaction.create({
                        userId: leader.userId,
                        type: "credit_to_wallet", // "credit_to_wallet" type hai toh aapke Credit history page me dikhega
                        source: "Leader Daily Closing",
                        amount: bonusAmount,
                        description: `10% Bonus on Today's Team Business of $${todayBusiness}`,
                        status: "success",
                        date: new Date()
                    });

                    console.log(`✅ [LEADER CLOSING] Paid $${bonusAmount} to Leader ${leader.userId}`);
                }
            }

            console.log("🎯 [CRON] Leader Closing Completed Successfully!");

        } catch (error) {
            console.error("❌ [CRON] Error in Leader Closing:", error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // India ke time ke hisaab se chalega
    });
};

module.exports = runDailyLeaderClosing;