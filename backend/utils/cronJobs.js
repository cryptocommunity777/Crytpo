const cron = require('node-cron');
const User = require('../models/User'); // Tumhara User model
// GLOBAL_POOLS array yahan bhi import kar lena

// Har raat 12:00 AM baje chalega
cron.schedule('0 0 * * *', async () => {
    console.log("Running Daily Global Pool Distribution...");

    try {
        // System me total kitne active (topped-up) users hain
        const totalActiveUsers = await User.countDocuments({ isToppedUp: true });

        const allUsers = await User.find({ isToppedUp: true });

        for (const user of allUsers) {
            // User ke aane ke baad kitne log globally aaye hain?
            const userGlobalTeam = totalActiveUsers - user.globalId;
            const userDirects = user.activeDirects || 0;

            // Check karo user kis pool me qualify kar raha hai
            for (const pool of GLOBAL_POOLS) {
                if (userGlobalTeam >= pool.globalTeam && userDirects >= pool.reqDirects) {
                    
                    // Check karo kya is pool ki puri income (e.g. 10 days tak) mil chuki hai?
                    const poolKey = `pool_${pool.level}_days_paid`;
                    const daysPaid = user.poolProgress ? user.poolProgress[poolKey] || 0 : 0;

                    if (daysPaid < pool.days) {
                        // User ko aaj ka ROI dedo
                        user.walletBalance = (user.walletBalance || 0) + pool.daily;
                        user.totalPoolIncome = (user.totalPoolIncome || 0) + pool.daily;
                        
                        // Progress update karo
                        if(!user.poolProgress) user.poolProgress = {};
                        user.poolProgress[poolKey] = daysPaid + 1;
                        
                        await user.save();
                        
                        // Transaction history create kar do ki pool income aayi hai
                        break; // Ek din me ek hi baar aage badhna hai
                    }
                }
            }
        }
    } catch (error) {
        console.error("Cron Job Error:", error);
    }
});