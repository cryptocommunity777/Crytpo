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
            // (100 / 1440) ka matlab din me lagbhag 100 users naturally aayenge.
           const shouldAddFakeUser = Math.random() < (100 / 1440); 
            
            // ⚠️ AGAR KABHI TESTING KARNI HO TOH UPAR WALI LINE HATA KE NICHE WALI LAGA DENA:
             
            if (shouldAddFakeUser) {
                
                // =======================================================
                // 🚀 A. NEW ULTRA-SMART DISTRIBUTION LOGIC (WITH CAPPING)
                // =======================================================
                
                const todayStr = new Date().toISOString().split('T')[0]; 

                // Sirf Active Users ko uthayenge. Inactive (Red) IDs yahan already ignore ho rahi hain.
                const activeUsers = await User.find({ isToppedUp: true })
                    .select('_id globalTeamCount directCount todayGlobalTeamAdded lastGlobalTeamAddDate');

                const bulkOps = [];

                for (const user of activeUsers) {
                    const team = user.globalTeamCount || 0;
                    const directs = user.directCount || 0;
                    
                    // Daily limit reset check
                    let todayAdded = user.todayGlobalTeamAdded || 0;
                    if (user.lastGlobalTeamAddDate !== todayStr) {
                        todayAdded = 0;
                    }

                    // --- STEP 1: STRICT MILESTONE LOCKS (Exact Target par hi rokega) ---
                    let isLocked = false;
                    
                    // Exact milestone par lock lagega
                    if (team === 760 && directs < 5) isLocked = true;
                    else if (team === 2360 && directs < 6) isLocked = true;
                    else if (team === 4360 && directs < 8) isLocked = true;
                    else if (team === 7360 && directs < 10) isLocked = true;
                    else if (team === 11360 && directs < 12) isLocked = true;
                    else if (team === 16360 && directs < 14) isLocked = true;
                    else if (team === 23860 && directs < 16) isLocked = true;
                    else if (team === 33860 && directs < 18) isLocked = true;

                    if (isLocked) continue; // Agar exact milestone par direct kam hain, toh yahin Jam/Freeze kardo.

                    // --- STEP 2: DAILY CAPPING LOGIC ---
                    if (team >= 760) {
                        let dailyCap = Math.min(directs * 20, 360);
                        
                        // 🔥 EXCEPTION: 
                        // Agar koi purana user 5 level (760) cross kar chuka hai bina 5 direct ke,
                        // toh usko beech raste me 0 cap dekar latkana nahi hai. 
                        // Usko naturally Level 6 (2360) tak jaane do.
                        if (team > 760 && team < 2360 && directs < 5) {
                            dailyCap = 360; // Natural max cap de diya taaki beech me team na atke
                        }
                        
                        if (todayAdded >= dailyCap) {
                            continue; // Is user ki aaj ki limit puri ho gayi
                        }
                    }

                    // --- STEP 3: AGAR USER ELIGIBLE HAI, TOH BULK WRITE ME DAALO ---
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
// ❌ Yahan se Instant Pool Income add karna aur Transaction create karna HATA DIYA HAI.
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