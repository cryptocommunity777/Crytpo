const cron = require('node-cron');
const User = require('../models/User'); 
const SystemStat = require('../models/SystemStat'); 
const Transaction = require('../models/Transaction'); 
const FakeUser = require('../models/FakeUser'); 
const { countryNames, countriesProbability } = require('../utils/fakeData'); 

// 12 Levels Global Auto-Pool Plan Logic ($30)
const GLOBAL_POOLS = [
    { level: 1,  globalTeam: 20,    reqDirects: 1,  daily: 1,  days: 10  }, 
    { level: 2,  globalTeam: 40,    reqDirects: 2,  daily: 1,  days: 20  }, 
    { level: 3,  globalTeam: 100,   reqDirects: 3,  daily: 1,  days: 40  }, 
    { level: 4,  globalTeam: 200,   reqDirects: 4,  daily: 1,  days: 80  }, 
    { level: 5,  globalTeam: 400,   reqDirects: 5,  daily: 1,  days: 150 }, 
    { level: 6,  globalTeam: 1600,  reqDirects: 6,  daily: 1,  days: 200 }, 
    { level: 7,  globalTeam: 2000,  reqDirects: 8,  daily: 2,  days: 250 }, 
    { level: 8,  globalTeam: 3000,  reqDirects: 10, daily: 2,  days: 350 }, 
    { level: 9,  globalTeam: 4000,  reqDirects: 12, daily: 2,  days: 500 }, 
    { level: 10, globalTeam: 5000,  reqDirects: 14, daily: 3,  days: 500 }, 
    { level: 11, globalTeam: 7500,  reqDirects: 16, daily: 6,  days: 500 }, 
    { level: 12, globalTeam: 10000, reqDirects: 18, daily: 10, days: 500 }  
];

// 🔥 Exact India (IST) ki Date nikalne ka function
const getISTDateStr = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5)); // India is +5:30
    return istDate.toISOString().split('T')[0];
};

const startGlobalGrowthCron = () => {

    // =========================================================================
    // 1. HAR 1 MINUTE WALI CRON (Growth + INSTANT Pool Unlock Logic)
    // =========================================================================
    cron.schedule('* * * * *', async () => {
        try {
            // 🔥 1. FAKE/SYSTEM GROWTH LOGIC (LIVE MODE: 100 Users/Day)
            const shouldAddFakeUser = Math.random() < (100 / 1440); 
            const todayStr = getISTDateStr();
             
            if (shouldAddFakeUser) {
                const activeUsers = await User.find({ isToppedUp: true })
                    .select('_id globalTeamCount directCount todayGlobalTeamAdded lastGlobalTeamAddDate');

                const bulkOps = [];

                for (const user of activeUsers) {
                    const team = user.globalTeamCount || 0;
                    const directs = user.directCount || 0;
                    
                  let isLocked = false;
                    
                    // 🔥 Exact match (===) hata kar Range (>= aur <) laga diya hai
                    if (team >= 2360 && team < 4360 && directs < 6) isLocked = true;
                    else if (team >= 4360 && team < 7360 && directs < 8) isLocked = true;
                    else if (team >= 7360 && team < 11360 && directs < 10) isLocked = true;
                    else if (team >= 11360 && team < 16360 && directs < 12) isLocked = true;
                    else if (team >= 16360 && team < 23860 && directs < 14) isLocked = true;
                    else if (team >= 23860 && team < 33860 && directs < 16) isLocked = true;
                    else if (team >= 33860 && directs < 18) isLocked = true;

                    if (isLocked) continue;

                    if (user.lastGlobalTeamAddDate !== todayStr) {
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: user._id },
                                update: {
                                    $inc: { globalTeamCount: 1 },
                                    $set: { todayGlobalTeamAdded: 1, lastGlobalTeamAddDate: todayStr }
                                }
                            }
                        });
                    } else {
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: user._id },
                                update: {
                                    $inc: { globalTeamCount: 1, todayGlobalTeamAdded: 1 },
                                    $set: { lastGlobalTeamAddDate: todayStr }
                                }
                            }
                        });
                    }
                }

                if (bulkOps.length > 0) {
                    await User.bulkWrite(bulkOps);
                }

                await SystemStat.findOneAndUpdate(
                    {}, 
                    { $inc: { globalFakeCount: 1 } }, 
                    { upsert: true, returnDocument: 'after' }
                );            
                
                const randomId = Math.floor(1000000 + Math.random() * 9000000); 
                const isRealUser = await User.exists({ userId: randomId });
                const isFakeUser = await FakeUser.exists({ userId: randomId });

                if (!isRealUser && !isFakeUser) {
                    let randomCountry = "IN";
                    if (typeof countriesProbability !== 'undefined' && countriesProbability?.length > 0) {
                        randomCountry = countriesProbability[Math.floor(Math.random() * countriesProbability.length)];
                    }

                    let randomName = "Crypto User";
                    if (typeof countryNames !== 'undefined') {
                        const namePool = countryNames[randomCountry] || countryNames["IN"];
                        if (namePool && namePool.length > 0) {
                            randomName = namePool[Math.floor(Math.random() * namePool.length)];
                        }
                    }

                    await FakeUser.create({
                        userId: randomId,
                        name: randomName,
                        country: randomCountry,
                        isToppedUp: true,
                        topUpAmount: 30,
                        date: new Date()
                    });
                } 
            }
            
            // 🔥 2. POOL UNLOCK DISTRIBUTION LOGIC (INSTANT PAYOUT ADDED)
            const eligibleUsers = await User.find({ directCount: { $gte: 1 }, isToppedUp: true });
            const currentTodayStr = getISTDateStr();

            for (let user of eligibleUsers) {
                let isUpdated = false;
                let cumulativeGlobalTeam = 0;

                for (let lvl of GLOBAL_POOLS) {
                    cumulativeGlobalTeam += lvl.globalTeam;

                    if (user.globalTeamCount >= cumulativeGlobalTeam && user.directCount >= lvl.reqDirects) {
                        const existingPool = user.activePools?.find(p => p.level === lvl.level);
                        
                        if (!existingPool) {
                            if (!user.activePools) user.activePools = [];
                            
                            // 🚀 NAYA LOGIC: Naya pool unlock hote hi aaj ka din aur paisa de do
                            user.activePools.push({
                                level: lvl.level,
                                dailyAmount: lvl.daily,
                                totalDays: lvl.days,
                                daysPaid: 1,               // 🔥 Day 1
                                lastPaidDate: currentTodayStr,    // 🔥 Aaj ki date
                                status: 'ACTIVE'
                            });

                            user.poolIncome = (user.poolIncome || 0) + lvl.daily; 
                            
                            await Transaction.create({
                                userId: user.userId,
                                type: 'credit',
                                source: 'pool',
                                amount: lvl.daily,
                                description: `Daily Community Income Level ${lvl.level} (Day 1 of ${lvl.days})`,
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
    // 2. DAILY MIDNIGHT CRON (Set to 11:30 AM temporarily for testing)
    // =========================================================================
    // 🔥 Puraane users ko abhi 11:30 par paisa chala jayega
    cron.schedule('0 0 * * *', async () => {
        try {
            const users = await User.find({ "activePools.status": "ACTIVE" });
            const todayStr = getISTDateStr();

            for (let user of users) {
                let isUpdated = false;

                for (let pool of user.activePools) {
                    if (pool.status === 'ACTIVE' && pool.daysPaid < pool.totalDays) {
                        
                        // Agar usko aaj paisa mil gaya hai, toh rok do
                        if (pool.lastPaidDate === todayStr) {
                            continue; 
                        }

                        // Paise add karo
                        user.poolIncome = (user.poolIncome || 0) + pool.dailyAmount; 
                        
                        // Transaction history banao
                        await Transaction.create({
                            userId: user.userId,
                            type: 'credit',
                            source: 'pool',
                            amount: pool.dailyAmount,
                            description: `Daily Community Income Level ${pool.level} (Day ${pool.daysPaid + 1} of ${pool.totalDays})`,
                            status: 'success'
                        });

                        // Day count aage badhao aur aaj ki date daal do
                        pool.daysPaid += 1;
                        pool.lastPaidDate = todayStr; 
                        isUpdated = true;

                        // Agar limits puri ho gayi toh pool Complete kardo
                        if (pool.daysPaid >= pool.totalDays) {
                            pool.status = 'COMPLETED';
                        }
                    }
                }
                if (isUpdated) await user.save();
            }
            console.log(`✅ [CRON] Community Payout Done for: ${todayStr}`);
        } catch (err) {
            console.error('[DAILY-POOL] Error:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // India Time
    });
};

module.exports = startGlobalGrowthCron;