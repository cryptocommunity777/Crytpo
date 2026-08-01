// // C:\Users\HP\Desktop\Cryptocommunity\backend\manualReward.js

// require('dotenv').config(); 
// const mongoose = require('mongoose');
// const User = require('./models/User'); 
// const Transaction = require('./models/Transaction');

// const REWARD_MILESTONES = [
//     { target: 50, strongLeg: 25, otherLegs: 25, reward: 30, title: "Target 1 (50 Points)" },
//     { target: 250, strongLeg: 125, otherLegs: 125, reward: 100, title: "Target 2 (250 Points)" },
//     { target: 750, strongLeg: 375, otherLegs: 375, reward: 200, title: "Target 3 (750 Points)" },
//     { target: 1750, strongLeg: 875, otherLegs: 875, reward: 300, title: "Target 4 (1750 Points)" },
//     { target: 3750, strongLeg: 1875, otherLegs: 1875, reward: 500, title: "Target 5 (3750 Points)" },
//     { target: 6750, strongLeg: 3375, otherLegs: 3375, reward: 1000, title: "Target 6 (6750 Points)" },
//     { target: 11750, strongLeg: 5875, otherLegs: 5875, reward: 1500, title: "Target 7 (11750 Points)" },
// ];

// const getMonthlyLegStats = async (sponsorId, startOfMonth, endOfMonth, allUsersMap) => {
//     const directs = allUsersMap.get(sponsorId) || [];
//     let legSizes = [];

//     for (let direct of directs) {
//         let currentLegSize = 0;
//         let queue = [direct]; 
        
//         while (queue.length > 0) {
//             const currentUserNode = queue.shift();
            
//             if (currentUserNode.role === 'leader') continue; 

//             const downlines = allUsersMap.get(currentUserNode.userId) || []; 
//             for (let d of downlines) {
//                 if (d.isToppedUp && d.topUpDate >= startOfMonth && d.topUpDate <= endOfMonth) {
//                     currentLegSize += 1; 
//                 }
//                 queue.push(d); 
//             }
//         }
        
//         legSizes.push({ size: currentLegSize, userId: direct.userId, name: direct.name });
//     }

//     legSizes.sort((a, b) => b.size - a.size);
//     const strongLegData = legSizes.length > 0 ? legSizes[0] : { size: 0, userId: null };
//     const otherLegsCount = legSizes.length > 1 ? legSizes.slice(1).reduce((a, b) => a + b.size, 0) : 0;

//     return { strongLeg: strongLegData.size, otherLegs: otherLegsCount };
// };

// const runManualReward = async () => {
//     try {
//         console.log("⏳ Connecting to Database...");
        
//         // 🔥 ERROR FIX: Purane connection options hata diye
//         await mongoose.connect(process.env.MONGO_URI);
        
//         console.log("✅ Database Connected Successfully!\n");

//         const now = new Date();
//         let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//         let endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
//         let startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1); 

//         console.log(`📊 Period: ${startOfLastMonth.toDateString()} to ${endOfLastMonth.toDateString()}`);
//         console.log(`🛡️ Double Payment Protection Date: ${startOfCurrentMonth.toDateString()}\n`);
//         console.log(`🚀 Checking for Pending Rewards... (Only showing newly paid users)\n`);

//         const allUsers = await User.find({}, 'userId name sponsorId isToppedUp topUpDate role').lean();
//         const userMap = new Map();
//         for (let u of allUsers) {
//             if (!userMap.has(u.sponsorId)) userMap.set(u.sponsorId, []);
//             userMap.get(u.sponsorId).push(u);
//         }

//         const eligibleUsers = allUsers.filter(u => u.isToppedUp);
//         let paidCount = 0;
//         let skippedCount = 0;

//         for (let user of eligibleUsers) {
//             const legStats = await getMonthlyLegStats(user.userId, startOfLastMonth, endOfLastMonth, userMap);
            
//             let highestEligibleReward = null;
//             for (let i = REWARD_MILESTONES.length - 1; i >= 0; i--) {
//                 const milestone = REWARD_MILESTONES[i];
//                 if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
//                     highestEligibleReward = milestone;
//                     break;
//                 }
//             }

//             if (highestEligibleReward) {
//                 const alreadyPaid = await Transaction.findOne({
//                     userId: user.userId,
//                     type: "reward_income",
//                     date: { $gte: startOfCurrentMonth }
//                 });

//                 if (alreadyPaid) {
//                     skippedCount++;
//                     continue; 
//                 }

//                 const userDoc = await User.findOne({ userId: user.userId });
                
//                 userDoc.rewardIncome = (userDoc.rewardIncome || 0) + highestEligibleReward.reward;
//                 userDoc.totalRewardIncome = (userDoc.totalRewardIncome || 0) + highestEligibleReward.reward;
//                 await userDoc.save();

//                 await Transaction.create({
//                     userId: userDoc.userId,
//                     type: "reward_income",
//                     source: "reward",
//                     amount: highestEligibleReward.reward,
//                     description: `Monthly Closing Reward: Achieved ${highestEligibleReward.title}`,
//                     status: 'success',
//                     date: new Date()
//                 });

//                 console.log(`✅ [NEW REWARD] PAID ID #${userDoc.userId} (Name: ${user.name || 'User'}) -> $${highestEligibleReward.reward} for ${highestEligibleReward.title}`);
//                 paidCount++;
//             }
//         }

//         console.log(`\n🎉 MANUAL REWARD DISTRIBUTION COMPLETED!`);
//         console.log(`✔️ Total Users Paid Today: ${paidCount}`);
//         console.log(`⏭️ Total Users Skipped (Already Paid Earlier): ${skippedCount}`);

//     } catch (err) {
//         console.error('\n❌ Error running manual script:', err);
//     } finally {
//         console.log("🔌 Disconnecting Database...");
//         await mongoose.disconnect();
//         process.exit(0); 
//     }
// };

// runManualReward();



// C:\Users\HP\Desktop\Cryptocommunity\backend\manualReward.js

require('dotenv').config(); 
const mongoose = require('mongoose');
const readline = require('readline'); // 🔥 NAYA: Terminal se input lene ke liye
const User = require('./models/User'); 
const Transaction = require('./models/Transaction');

const REWARD_MILESTONES = [
    { target: 50, strongLeg: 25, otherLegs: 25, reward: 30, title: "Target 1 (50 Points)" },
    { target: 250, strongLeg: 125, otherLegs: 125, reward: 100, title: "Target 2 (250 Points)" },
    { target: 750, strongLeg: 375, otherLegs: 375, reward: 200, title: "Target 3 (750 Points)" },
    { target: 1750, strongLeg: 875, otherLegs: 875, reward: 300, title: "Target 4 (1750 Points)" },
    { target: 3750, strongLeg: 1875, otherLegs: 1875, reward: 500, title: "Target 5 (3750 Points)" },
    { target: 6750, strongLeg: 3375, otherLegs: 3375, reward: 1000, title: "Target 6 (6750 Points)" },
    { target: 11750, strongLeg: 5875, otherLegs: 5875, reward: 1500, title: "Target 7 (11750 Points)" },
];

const getMonthlyLegStats = async (sponsorId, startOfMonth, endOfMonth, allUsersMap) => {
    const directs = allUsersMap.get(sponsorId) || [];
    let legSizes = [];

    for (let direct of directs) {
        let currentLegSize = 0;
        let queue = [direct]; 
        
        while (queue.length > 0) {
            const currentUserNode = queue.shift();
            
            if (currentUserNode.role === 'leader') continue; 

            const downlines = allUsersMap.get(currentUserNode.userId) || []; 
            for (let d of downlines) {
                if (d.isToppedUp && d.topUpDate >= startOfMonth && d.topUpDate <= endOfMonth) {
                    currentLegSize += 1; 
                }
                queue.push(d); 
            }
        }
        
        legSizes.push({ size: currentLegSize, userId: direct.userId, name: direct.name });
    }

    legSizes.sort((a, b) => b.size - a.size);
    const strongLegData = legSizes.length > 0 ? legSizes[0] : { size: 0, userId: null };
    const otherLegsCount = legSizes.length > 1 ? legSizes.slice(1).reduce((a, b) => a + b.size, 0) : 0;

    return { strongLeg: strongLegData.size, otherLegs: otherLegsCount };
};

// Console se question puchne ke liye helper function
const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
};

const runManualReward = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected Successfully!\n");

        const now = new Date();
        let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        let endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        let startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1); 

        console.log(`📊 Period: ${startOfLastMonth.toDateString()} to ${endOfLastMonth.toDateString()}`);
        console.log(`🛡️ Double Payment Protection Date: ${startOfCurrentMonth.toDateString()}\n`);
        console.log(`🚀 Scanning network for eligible users... Please wait.\n`);

        const allUsers = await User.find({}, 'userId name sponsorId isToppedUp topUpDate role').lean();
        const userMap = new Map();
        for (let u of allUsers) {
            if (!userMap.has(u.sponsorId)) userMap.set(u.sponsorId, []);
            userMap.get(u.sponsorId).push(u);
        }

        const eligibleUsers = allUsers.filter(u => u.isToppedUp);
        
        let pendingPayouts = []; // Jinhe payment milna hai, unki list yahan jama hogi
        let skippedCount = 0;    // Jinko already mil chuka hai

        // 🛑 STEP 1: Sirf calculation karo (Data save mat karo)
        for (let user of eligibleUsers) {
            const legStats = await getMonthlyLegStats(user.userId, startOfLastMonth, endOfLastMonth, userMap);
            
            let highestEligibleReward = null;
            for (let i = REWARD_MILESTONES.length - 1; i >= 0; i--) {
                const milestone = REWARD_MILESTONES[i];
                if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
                    highestEligibleReward = milestone;
                    break;
                }
            }

            if (highestEligibleReward) {
                // Double payment check
                const alreadyPaid = await Transaction.findOne({
                    userId: user.userId,
                    type: "reward_income",
                    date: { $gte: startOfCurrentMonth }
                });

                if (alreadyPaid) {
                    skippedCount++;
                    continue; 
                }

                // Agar eligible hai aur paid nahi hai, toh array me daal do
                pendingPayouts.push({
                    userId: user.userId,
                    name: user.name,
                    reward: highestEligibleReward.reward,
                    title: highestEligibleReward.title
                });
            }
        }

        // 🛑 STEP 2: SUMMARY DIKHAO AUR ADMIN SE PUCHO
        console.log(`====================================================`);
        console.log(`📊 REWARD SUMMARY REPORT`);
        console.log(`====================================================`);
        console.log(`✅ Users Eligible for NEW Reward   : ${pendingPayouts.length}`);
        console.log(`⏭️ Users Already Paid (Skipped)    : ${skippedCount}`);
        
        let totalDollarAmount = pendingPayouts.reduce((sum, item) => sum + item.reward, 0);
        console.log(`💰 Total Funds to be Distributed   : $${totalDollarAmount}`);
        console.log(`====================================================\n`);

        if (pendingPayouts.length === 0) {
            console.log("🎉 No new pending payments found. Sab clear hai!");
            return; // Niche finally block me jaake disconnect ho jayega
        }

        // YES/NO Pucho
        const answer = await askQuestion(`⚠️ Do you want to proceed and pay these ${pendingPayouts.length} users? (Type 'yes' or 'no'): `);

        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            console.log("\n🚀 Executing Payments...\n");

            // 🛑 STEP 3: Agar 'yes' bola toh hi database me entry karo
            let paidCount = 0;
            for (let payout of pendingPayouts) {
                const userDoc = await User.findOne({ userId: payout.userId });
                
                userDoc.rewardIncome = (userDoc.rewardIncome || 0) + payout.reward;
                userDoc.totalRewardIncome = (userDoc.totalRewardIncome || 0) + payout.reward;
                await userDoc.save();

                await Transaction.create({
                    userId: userDoc.userId,
                    type: "reward_income",
                    source: "reward",
                    amount: payout.reward,
                    description: `Monthly Closing Reward: Achieved ${payout.title}`,
                    status: 'success',
                    date: new Date()
                });

                console.log(`✅ [PAID] ID #${payout.userId} (${payout.name || 'User'}) -> $${payout.reward} for ${payout.title}`);
                paidCount++;
            }

            console.log(`\n🎉 MANUAL REWARD DISTRIBUTION COMPLETED SUCCESSFULLY! (${paidCount} Users Paid)`);
        } else {
            console.log("\n❌ Payment Process ABORTED by Admin. Koi paisa nahi gaya.");
        }

    } catch (err) {
        console.error('\n❌ Error running manual script:', err);
    } finally {
        console.log("🔌 Disconnecting Database...");
        await mongoose.disconnect();
        process.exit(0); 
    }
};

runManualReward();