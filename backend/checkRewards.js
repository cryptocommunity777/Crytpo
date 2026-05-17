require('dotenv').config();
const mongoose = require('mongoose');

// Models
const User = require('./models/User');

async function checkMistakeRewards() {
    console.log("\n🔍 Database check kar rahe hain, galat reward wali IDs ki list:\n");
    try {
        // Un sabhi users ko nikalo jinki totalRewardIncome 0 se badi hai
        const affectedUsers = await User.find({ totalRewardIncome: { $gt: 0 } })
            .select('userId name rewardIncome totalRewardIncome claimedRewards walletBalance');
        
        if (affectedUsers.length === 0) {
            console.log("✅ Sab saaf hai! Kisi bhi user ko galat reward nahi mila hai.");
            process.exit(0);
        }

        let totalSystemLoss = 0;
        console.log("----------------------------------------------------------------------");
        console.log("User ID   | Name                 | Reward Wallet | Total Reward | Main Wallet Balance");
        console.log("----------------------------------------------------------------------");
        
        affectedUsers.forEach(user => {
            totalSystemLoss += (user.totalRewardIncome || 0);
            console.log(
                `${String(user.userId).padEnd(9)} | ` +
                `${user.name.padEnd(20)} | ` +
                `$${String(user.rewardIncome).padEnd(12)} | ` +
                `$${String(user.totalRewardIncome).padEnd(11)} | ` +
                `$${user.walletBalance}`
            );
        });

        console.log("----------------------------------------------------------------------");
        console.log(`⚠️ Total Affected Users Found: ${affectedUsers.length}`);
        console.log(`💰 Total System Loss to Recover: $${totalSystemLoss}`);
        console.log("----------------------------------------------------------------------\n");

    } catch (err) {
        console.error("❌ Error while checking:", err);
    }
}

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully!');
        await checkMistakeRewards();
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });