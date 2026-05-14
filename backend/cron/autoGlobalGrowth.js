const cron = require('node-cron');
const User = require('../models/User'); 
const SystemStat = require('../models/SystemStat'); // 👈 Naya aur professional naam
const Transaction = require('../models/Transaction'); 

// ✅ 12 Levels Global Auto-Pool Plan Logic ($30)
const GLOBAL_POOLS = [
    { level: 1, globalTeam: 20, reqDirects: 1, daily: 1, days: 10 },
    { level: 2, globalTeam: 40, reqDirects: 1, daily: 1, days: 20 },
    { level: 3, globalTeam: 100, reqDirects: 1, daily: 1, days: 40 },
    { level: 4, globalTeam: 200, reqDirects: 1, daily: 1, days: 80 },
    { level: 5, globalTeam: 400, reqDirects: 1, daily: 1, days: 150 },
    { level: 6, globalTeam: 1600, reqDirects: 1, daily: 1, days: 200 },
    { level: 7, globalTeam: 2000, reqDirects: 2, daily: 2, days: 250 },
    { level: 8, globalTeam: 3000, reqDirects: 2, daily: 2, days: 350 },
    { level: 9, globalTeam: 4000, reqDirects: 2, daily: 2, days: 500 },
    { level: 10, globalTeam: 5000, reqDirects: 2, daily: 3, days: 500 },
    { level: 11, globalTeam: 7500, reqDirects: 2, daily: 6, days: 500 },
    { level: 12, globalTeam: 10000, reqDirects: 2, daily: 10, days: 500 }
];

const startGlobalGrowthCron = () => {

    // =========================================================================
    // 1. HAR 1 MINUTE WALI CRON (Growth + Pool Unlock Logic)
    // =========================================================================
    cron.schedule('* * * * *', async () => {
        try {
            // 🔥 1. FAKE/SYSTEM GROWTH LOGIC (Target: ~100 per day)
            // 1 Din = 1440 minutes. 100/1440 = 0.069 (Lagbhag 7% chance har minute)
         // 🔥 1. FAKE/SYSTEM GROWTH LOGIC (Target: ~100 per day)
const shouldAddFakeUser = Math.random() < (100 / 1440);

if (shouldAddFakeUser) {
    // ✅ FIX: Ab sirf unhi users ki downline badhegi jinka ID Top-up (Active) hai
    // Humne {} ki jagah { isToppedUp: true } laga diya hai
    await User.updateMany(
        { isToppedUp: true }, 
        { $inc: { globalTeamCount: 1 } }
    );

    // B. SYSTEM TOTAL FAKE COUNT (Ye hamesha badhega system stats ke liye)
    await SystemStat.findOneAndUpdate(
        {}, 
        { $inc: { globalFakeCount: 1 } }, 
        { upsert: true, returnDocument: 'after' }
    );            
    
    console.log("✅ Cron Success: +1 User added to Active Users & Total Community!");
}       
            // 🔥 2. POOL UNLOCK DISTRIBUTION LOGIC (Chahe fake aaye ya real)
            const eligibleUsers = await User.find({ directCount: { $gte: 1 }, isToppedUp: true });
            const todayStr = new Date().toISOString().split('T')[0]; 

            for (let user of eligibleUsers) {
                let isUpdated = false;
                let cumulativeGlobalTeam = 0;

                for (let lvl of GLOBAL_POOLS) {
                    cumulativeGlobalTeam += lvl.globalTeam;

                    if (user.globalTeamCount >= cumulativeGlobalTeam && user.directCount >= lvl.reqDirects) {
                        const existingPool = user.activePools?.find(p => p.level === lvl.level);
                        
                        if (!existingPool) {
                            if (!user.activePools) user.activePools = [];
                            
                            user.activePools.push({
                                level: lvl.level,
                                dailyAmount: lvl.daily,
                                totalDays: lvl.days,
                                daysPaid: 1, 
                                lastPaidDate: todayStr, 
                                status: 'ACTIVE'
                            });

                            user.poolIncome = (user.poolIncome || 0) + lvl.daily;
                            
                            await Transaction.create({
                                userId: user.userId, 
                                type: 'credit',
                                source: 'pool',
                                amount: lvl.daily,
                                description: `Auto-Pool Level ${lvl.level} Unlocked - Day 1 Income`,
                                status: 'success'
                            });

                            isUpdated = true;
                        }
                    }
                }
                if (isUpdated) await user.save();
            }
        } catch (err) {
            console.error('[AUTO-GROWTH] Error:', err);
        }
    });

    // =========================================================================
    // 2. DAILY MIDNIGHT CRON (Bache hue din ka paisa dene ke liye)
    // =========================================================================
    cron.schedule('0 0 * * *', async () => {
        try {
            const users = await User.find({ "activePools.status": "ACTIVE" });
            const todayStr = new Date().toISOString().split('T')[0];

            for (let user of users) {
                let isUpdated = false;

                for (let pool of user.activePools) {
                    if (pool.status === 'ACTIVE' && pool.daysPaid < pool.totalDays) {
                        
                        // Agar aaj ka paisa pehle hi mil chuka hai (jaise unlock wale din), toh skip karo
                        if (pool.lastPaidDate === todayStr) {
                            continue; 
                        }

                        user.poolIncome = (user.poolIncome || 0) + pool.dailyAmount; 
                        
                        await Transaction.create({
                            userId: user.userId,
                            type: 'credit',
                            source: 'pool',
                            amount: pool.dailyAmount,
                            description: `Daily Single Leg Community Income Level ${pool.level} (Day ${pool.daysPaid + 1} of ${pool.totalDays})`,
                            status: 'success'
                        });

                        pool.daysPaid += 1;
                        pool.lastPaidDate = todayStr; 
                        isUpdated = true;

                        if (pool.daysPaid >= pool.totalDays) {
                            pool.status = 'COMPLETED';
                        }
                    }
                }
                if (isUpdated) await user.save();
            }
        } catch (err) {
            console.error('[DAILY-POOL] Error:', err);
        }
    });
};

module.exports = startGlobalGrowthCron;