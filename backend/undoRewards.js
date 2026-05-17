require('dotenv').config();
const mongoose = require('mongoose');

// Models
const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function undoMistakeRewards() {
    console.log("\n🧹 Database se galat fund recovery (Undo) chalu ho raha hai...\n");
    try {
        const users = await User.find({ totalRewardIncome: { $gt: 0 } });
        
        if (users.length === 0) {
            console.log("✅ Recovery ki koi zaroorat nahi hai. Database already clear hai!");
            process.exit(0);
        }

        let resetCount = 0;
        let totalRecovered = 0;

        for (let user of users) {
            totalRecovered += (user.totalRewardIncome || 0);

            // 1. Reward balances ko reset (zero) kiya
            user.rewardIncome = 0;
            user.totalRewardIncome = 0;

            // 2. Claimed milestones khali kiye taaki month-end cron fresh count de sake
            user.claimedRewards = []; 

            // 🚨 AGAR AAPNE MAIN BALANCE SE BHI MINUS KARNA HAI TO NICHE WALI LINE SE // HATA DENA:
            // user.walletBalance = Math.max(0, (user.walletBalance || 0) - user.totalRewardIncome);

            await user.save();
            resetCount++;
            console.log(`✅ Recovered & Reset successfully -> User ID: ${user.userId}`);
        }

        // 3. Fake Transactions logs ko database se permanent uda do
        const deletedTxs = await Transaction.deleteMany({ source: "reward", type: "reward_income" });

        console.log("\n🎉 ============================================");
        console.log(`✅ Total Users Reset in DB: ${resetCount}`);
        console.log(`💰 Total Funds Recovered: $${totalRecovered}`);
        console.log(`🗑️ History Records Deleted from Transactions: ${deletedTxs.deletedCount}`);
        console.log("============================================\n");

    } catch (err) {
        console.error("❌ Error during undo execution:", err);
    }
}

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully!');
        await undoMistakeRewards();
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });