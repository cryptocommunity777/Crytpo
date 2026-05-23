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

const startGlobalGrowthCron = () => {

    // 🔥 YAHAN EK NAYI FUNCTION BANAYI HAI JO CRON MEIN USE HOGI
    const getStopConditions = () => {
    const allMilestones = [360, 760, 2360, 4360, 7360, 11360, 16360, 23860, 33860];
    return [
        // 1. Inactive (Red ID) - Inke liye 360 se hi lock rakho
        { isToppedUp: false, globalTeamCount: { $in: allMilestones } },
        
        // 2. 🔥 CHANGE KIYA: Active (Green ID) with 0 Directs - Ab 360 par nahi rukega, seedha 760 par rukega
        { isToppedUp: true, directCount: { $lt: 1 }, globalTeamCount: { $in: [760, 2360, 4360, 7360, 11360, 16360, 23860, 33860] } },
        
        // 3. Active (Green ID) with 1 to 4 Directs: Ye pehle se hi 760 par ruk rahe the
        { isToppedUp: true, directCount: { $lt: 5 }, globalTeamCount: { $in: [760, 2360, 4360, 7360, 11360, 16360, 23860, 33860] } },
        
        // Baaki sab limits same rahengi
        { isToppedUp: true, directCount: { $lt: 6 }, globalTeamCount: { $in: [2360, 4360, 7360, 11360, 16360, 23860, 33860] } },
        { isToppedUp: true, directCount: { $lt: 8 }, globalTeamCount: { $in: [4360, 7360, 11360, 16360, 23860, 33860] } },
        { isToppedUp: true, directCount: { $lt: 10 }, globalTeamCount: { $in: [7360, 11360, 16360, 23860, 33860] } },
        { isToppedUp: true, directCount: { $lt: 12 }, globalTeamCount: { $in: [11360, 16360, 23860, 33860] } },
        { isToppedUp: true, directCount: { $lt: 14 }, globalTeamCount: { $in: [16360, 23860, 33860] } },
        { isToppedUp: true, directCount: { $lt: 16 }, globalTeamCount: { $in: [23860, 33860] } },
        { isToppedUp: true, directCount: { $lt: 18 }, globalTeamCount: { $in: [33860] } }
    ];
};

    // =========================================================================
    // 1. HAR 1 MINUTE WALI CRON (Growth + Pool Unlock Logic)
    // =========================================================================
    cron.schedule('* * * * *', async () => {
        try {
            // 🔥 1. FAKE/SYSTEM GROWTH LOGIC 
            const shouldAddFakeUser = Math.random() < (100 / 1440);  
            
        // const shouldAddFakeUser = true; 
            if (shouldAddFakeUser) {
                
                // =======================================================
                // 🚀 A. NAYA SMART DISTRIBUTION LOGIC
                // =======================================================
                
                const stopConditions = getStopConditions();

                // Ye command un sabko +1 karegi jo upar wale stopConditions me nahi aate
                await User.updateMany(
                    { $nor: stopConditions },
                    { $inc: { globalTeamCount: 1 } }
                );
                // =======================================================


                // B. SYSTEM TOTAL FAKE COUNT (Ye hamesha badhega system stats ke liye)
                await SystemStat.findOneAndUpdate(
                    {}, 
                    { $inc: { globalFakeCount: 1 } }, 
                    { upsert: true, returnDocument: 'after' }
                );            
                
                // C. EK NAYI FAKE ID CREATE KARNA
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
                    
                    console.log(`✅ Cron Success: Fake User [${randomName} - ${randomCountry} - #${randomId}] Created!`);
                } else {
                    console.log(`⚠️ ID Clash (${randomId}). Skipping fake user creation this minute.`);
                } 
            }
            
            // 🔥 2. POOL UNLOCK DISTRIBUTION LOGIC 
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
                                description: `Single leg Level ${lvl.level} Unlocked - Day 1 Income`,
                                status: 'success'
                            });

                            isUpdated = true;
                        }
                    }
                }
                
                // Bracket fix: Ye loop ke theek andar hona chahiye
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