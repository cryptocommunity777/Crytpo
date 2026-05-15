// C:\Users\HP\Desktop\Cryptocommunity\backend\fixWrongPools.js
const mongoose = require('mongoose');
const User = require('./models/User'); // Model path check kar lena bhai
require('dotenv').config();

// 🔥 Naya strict rules table jiske mutabiq check karna hai
const REQUIRED_DIRECTS = {
    1: 1,  // Level 1 -> 1 Direct
    2: 2,  // Level 2 -> 2 Directs
    3: 3,  // Level 3 -> 3 Directs
    4: 4,  // Level 4 -> 4 Directs
    5: 5,  // Level 5 -> 5 Directs
    6: 6,  // Level 6 -> 6 Directs
    7: 8,  // Level 7 -> 8 Directs
    8: 10, // Level 8 -> 10 Directs
    9: 12, // Level 9 -> 12 Directs
    10: 14,// Level 10 -> 14 Directs
    11: 16,// Level 11 -> 16 Directs
    12: 18 // Level 12 -> 18 Directs
};

const fixDatabasePools = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptocommunity");
        console.log("🔗 Connected! Scanning users for wrong pool entries...");

        // Sirf unhi users ko uthao jinke paas kam se kam ek active pool ho
        const users = await User.find({ "activePools.0": { $exists: true } });
        
        let totalUsersFixed = 0;

        for (let user of users) {
            let isUserUpdated = false;
            let wrongIncomeDeducted = 0;
            
            // Filter out invalid pools based on new strict direct limits
            const validPools = [];

            for (let pool of user.activePools) {
                const required = REQUIRED_DIRECTS[pool.level] || 1;
                const currentDirects = user.directCount || 0;

                if (currentDirects < required) {
                    // 🚨 GALAT POOL DETECTED!
                    // Hisaab lagao kitna paisa galti se ja chuka hai
                    const paidAmount = (pool.daysPaid || 0) * (pool.dailyAmount || 0);
                    wrongIncomeDeducted += paidAmount;
                    
                    console.log(`⚠️ ALERT: User #${user.userId} (${user.name}) has Level ${pool.level} Active with only ${currentDirects} Direct(s). Required: ${required}. Wrongly Paid: $${paidAmount}`);
                    
                    isUserUpdated = true;
                } else {
                    // Agar shart poori hai toh pool ko valid list me rakho
                    validPools.push(pool);
                }
            }

            if (isUserUpdated) {
                // Wallet Balance aur Pool Income se galat paisa minus karo
                user.walletBalance = Math.max(0, (user.walletBalance || 0) - wrongIncomeDeducted);
                user.poolIncome = Math.max(0, (user.poolIncome || 0) - wrongIncomeDeducted);
                
                // Galat pools ko array se saaf karke sirf valid waale bacha do
                user.activePools = validPools;

                await user.save();
                totalUsersFixed++;
                console.log(`✅ FIXED User #${user.userId}: Deducted $${wrongIncomeDeducted} & Re-locked wrong pools.`);
                console.log(`--------------------------------------------------`);
            }
        }

        console.log(`\n🎉 CLEANUP SUCCESSFUL: Total ${totalUsersFixed} users data corrected properly!`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Cleanup Error:", err);
        process.exit(1);
    }
};

fixDatabasePools();