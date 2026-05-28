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

    // =========================================================================
    // 1. HAR 1 MINUTE WALI CRON (Growth + Pool Unlock Logic)
    // =========================================================================
    cron.schedule('* * * * *', async () => {
        try {
            // 🔥 1. FAKE/SYSTEM GROWTH LOGIC (LIVE MODE: 100 Users/Day)
            const shouldAddFakeUser = Math.random() < (100 / 1440); 
             
             
            if (shouldAddFakeUser) {
                
                // =======================================================
                // 🚀 A. NEW NATURAL DISTRIBUTION LOGIC (NO CAPPING)
                // =======================================================
                
                const todayStr = new Date().toISOString().split('T')[0]; 

                // Sirf Active Users ko uthayenge.
                const activeUsers = await User.find({ isToppedUp: true })
                    .select('_id globalTeamCount directCount todayGlobalTeamAdded lastGlobalTeamAddDate');

                const bulkOps = [];

                for (const user of activeUsers) {
                    const team = user.globalTeamCount || 0;
                    const directs = user.directCount || 0;
                    
                    // Daily limit reset check (Sirf Admin panel me dikhane ke liye chahiye)
                    let todayAdded = user.todayGlobalTeamAdded || 0;
                    if (user.lastGlobalTeamAddDate !== todayStr) {
                        todayAdded = 0;
                    }

                    // --- STEP 1: STRICT MILESTONE LOCKS (Level 6 Tak Free Growth) ---
                    let isLocked = false;
                    
                    // 🔥 NAYA LOGIC: Level 5 (760) ka lock hata diya. Ab seedha Level 6 (2360) par lock lagega
                    if (team === 2360 && directs < 6) isLocked = true;       // Level 6 to 7
                    else if (team === 4360 && directs < 8) isLocked = true;  // Level 7 to 8
                    else if (team === 7360 && directs < 10) isLocked = true; // Level 8 to 9
                    else if (team === 11360 && directs < 12) isLocked = true; // Level 9 to 10
                    else if (team === 16360 && directs < 14) isLocked = true; // Level 10 to 11
                    else if (team === 23860 && directs < 16) isLocked = true; // Level 11 to 12
                    else if (team === 33860 && directs < 18) isLocked = true; // Full Plan Complete

                    if (isLocked) continue; // Agar exact milestone par direct kam hain, toh yahin Jam/Freeze kardo.

                    // --- STEP 2: DAILY CAPPING LOGIC (REMOVED) ---
                    // Capping puri tarah hata di gayi hai. Natural speed se badhega.

                    // --- STEP 3: AGAR USER ELIGIBLE HAI, TOH BULK WRITE ME DAALO ---
                    if (user.lastGlobalTeamAddDate !== todayStr) {
                        // 🔄 NAYA DIN AAYA HAI: Aaj ka count DB me 1 se restart karo
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
                        // ⏩ SAME DIN HAI: Normal increment karte raho
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

                // Ek sath sabhi users ko DB mein update karo
                if (bulkOps.length > 0) {
                    await User.bulkWrite(bulkOps);
                }
                // =======================================================


                // B. SYSTEM TOTAL FAKE COUNT
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
                    console.log(`⚠️ ID Clash (${randomId}). Skipping fake user creation this is minute.`);
                } 
            }
            
            // 🔥 2. POOL UNLOCK DISTRIBUTION LOGIC (Koi Change Nahi)
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
                            
                          // 🔥 NAYA CODE (Sirf Pool unlock karega, paisa Midnight cron degi)
                            user.activePools.push({
                                level: lvl.level,
                                dailyAmount: lvl.daily,
                                totalDays: lvl.days,
                                daysPaid: 0,       // 🔥 Day 0 set kiya hai, raat ko ye 1 ho jayega
                                lastPaidDate: "",  // 🔥 Blank chhod diya taaki Midnight cron aaj hi isko pakad le
                                status: 'ACTIVE'
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
    // 2. DAILY MIDNIGHT CRON (Koi Change Nahi)
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
                            description: `Daily Community Income Level ${pool.level} (Day ${pool.daysPaid + 1} of ${pool.totalDays})`,
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