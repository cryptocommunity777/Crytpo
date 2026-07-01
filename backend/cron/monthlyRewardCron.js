// // C:\Users\HP\Desktop\Cryptocommunity\backend\cron\monthlyRewardCron.js
// const cron = require('node-cron');
// const User = require('../models/User');
// const Transaction = require('../models/Transaction');

// const REWARD_MILESTONES = [
//   { target: 50, strongLeg: 25, otherLegs: 25, reward: 30, title: "Target 1 (50 Points)" },
//   { target: 250, strongLeg: 125, otherLegs: 125, reward: 100, title: "Target 2 (250 Points)" },
//   { target: 750, strongLeg: 375, otherLegs: 375, reward: 200, title: "Target 3 (750 Points)" },
//   { target: 1750, strongLeg: 875, otherLegs: 875, reward: 300, title: "Target 4 (1750 Points)" },
//   { target: 3750, strongLeg: 1875, otherLegs: 1875, reward: 500, title: "Target 5 (3750 Points)" },
//   { target: 6750, strongLeg: 3375, otherLegs: 3375, reward: 1000, title: "Target 6 (6750 Points)" },
//   { target: 11750, strongLeg: 5875, otherLegs: 5875, reward: 1500, title: "Target 7 (11750 Points)" },
//  ];

// // 🔥 SUPERFAST LOGIC + ABSOLUTE BREAKAWAY (Sync with Admin Panel)
// const getMonthlyLegStats = async (sponsorId, startOfMonth, endOfMonth) => {
//     // 1. Memory mein saare users load karenge
//     const allUsers = await User.find({}, 'userId name sponsorId isToppedUp topUpDate role').lean();

//     // 2. Map banayenge fast lookup ke liye
//     const userMap = new Map();
//     for (let u of allUsers) {
//         if (!userMap.has(u.sponsorId)) {
//             userMap.set(u.sponsorId, []);
//         }
//         userMap.get(u.sponsorId).push(u);
//     }

//     // 3. Calculation Memory mein hogi
//     const directs = userMap.get(sponsorId) || [];
//     let legSizes = [];

//     for (let direct of directs) {
//         let currentLegSize = 0;
//         let queue = [direct]; 
        
//         while (queue.length > 0) {
//             const currentUserNode = queue.shift();
            
//             // 🛑 ABSOLUTE BREAKAWAY WALL: 
//             // Agar yeh banda Leader hai, toh iske aage ki team process nahi hogi.
//             if (currentUserNode.role === 'leader') {
//                continue; 
//             }

//             // Agar Leader nahi hai, toh iski downline uthao
//             const downlines = userMap.get(currentUserNode.userId) || []; 
//             for (let d of downlines) {
//                 // 🔥 FIX EXACTLY LIKE ADMIN: Point counting yahan downlines par lagayi hai.
//                 // Isse direct member ka apna top-up count nahi hoga, sirf neeche ki team count hogi.
//                 if (d.isToppedUp && d.topUpDate >= startOfMonth && d.topUpDate <= endOfMonth) {
//                     currentLegSize += 1; 
//                 }
//                 queue.push(d); 
//             }
//         }
        
//         // Save the leg stat
//         legSizes.push({ 
//             size: currentLegSize, 
//             userId: direct.userId, 
//             name: direct.name 
//         });
//     }

//     // 4. Sort (Descending)
//     legSizes.sort((a, b) => b.size - a.size);

//     // Strong Leg & Other Legs
//     const strongLegData = legSizes.length > 0 ? legSizes[0] : { size: 0, userId: null, name: null };
//     const otherLegsCount = legSizes.length > 1 ? legSizes.slice(1).reduce((a, b) => a + b.size, 0) : 0;

//     return { 
//         strongLeg: strongLegData.size, 
//         otherLegs: otherLegsCount,
//         strongLegId: strongLegData.userId,
//         strongLegName: strongLegData.name
//     };
// };

// // 🔥 Ye Cron har mahine ki 1 tareekh ko Raat 12:15 AM par chalega ('15 0 1 * *')
// cron.schedule('15 0 1 * *', async () => {
//     console.log('🏆 Running Monthly Reward Cron Closing...');
//     try {
//         const now = new Date();
        
//         let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//         let endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

//         const allUsers = await User.find({ isToppedUp: true }).lean();

//         for (let user of allUsers) {
//             const legStats = await getMonthlyLegStats(user.userId, startOfLastMonth, endOfLastMonth);
            
//             let highestEligibleReward = null;

//             for (let i = REWARD_MILESTONES.length - 1; i >= 0; i--) {
//                 const milestone = REWARD_MILESTONES[i];
//                 if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
//                     highestEligibleReward = milestone;
//                     break;
//                 }
//             }

//             if (highestEligibleReward) {
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

//                 console.log(`✅ Paid $${highestEligibleReward.reward} to User ${userDoc.userId} for Monthly Target.`);
//             }
//         }
//         console.log('🎉 Monthly Reward Closing Completed Successfully!');
//     } catch (err) {
//         console.error('❌ Monthly Reward Cron Error:', err);
//     }
// });

// module.exports = { getMonthlyLegStats };



const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const REWARD_MILESTONES = [
  { target: 50, strongLeg: 25, otherLegs: 25, reward: 30, title: "Target 1 (50 Points)" },
  { target: 250, strongLeg: 125, otherLegs: 125, reward: 100, title: "Target 2 (250 Points)" },
  { target: 750, strongLeg: 375, otherLegs: 375, reward: 200, title: "Target 3 (750 Points)" },
  { target: 1750, strongLeg: 875, otherLegs: 875, reward: 300, title: "Target 4 (1750 Points)" },
  { target: 3750, strongLeg: 1875, otherLegs: 1875, reward: 500, title: "Target 5 (3750 Points)" },
  { target: 6750, strongLeg: 3375, otherLegs: 3375, reward: 1000, title: "Target 6 (6750 Points)" },
  { target: 11750, strongLeg: 5875, otherLegs: 5875, reward: 1500, title: "Target 7 (11750 Points)" },
 ];

// 🔥 SUPERFAST LOGIC + ABSOLUTE BREAKAWAY (Sync with Admin Panel)
const getMonthlyLegStats = async (sponsorId, startOfMonth, endOfMonth) => {
    // 1. Memory mein saare users load karenge
    const allUsers = await User.find({}, 'userId name sponsorId isToppedUp topUpDate role').lean();

    // 2. Map banayenge fast lookup ke liye
    const userMap = new Map();
    for (let u of allUsers) {
        if (!userMap.has(u.sponsorId)) {
            userMap.set(u.sponsorId, []);
        }
        userMap.get(u.sponsorId).push(u);
    }

    // 3. Calculation Memory mein hogi
    const directs = userMap.get(sponsorId) || [];
    let legSizes = [];

    for (let direct of directs) {
        let currentLegSize = 0;
        let queue = [direct]; 
        
        while (queue.length > 0) {
            const currentUserNode = queue.shift();
            
            // 🛑 ABSOLUTE BREAKAWAY WALL: 
            if (currentUserNode.role === 'leader') {
               continue; 
            }

            const downlines = userMap.get(currentUserNode.userId) || []; 
            for (let d of downlines) {
                // Point counting yahan downlines par lagayi hai.
                if (d.isToppedUp && d.topUpDate >= startOfMonth && d.topUpDate <= endOfMonth) {
                    currentLegSize += 1; 
                }
                queue.push(d); 
            }
        }
        
        // Save the leg stat
        legSizes.push({ 
            size: currentLegSize, 
            userId: direct.userId, 
            name: direct.name 
        });
    }

    // 4. Sort (Descending)
    legSizes.sort((a, b) => b.size - a.size);

    // Strong Leg & Other Legs
    const strongLegData = legSizes.length > 0 ? legSizes[0] : { size: 0, userId: null, name: null };
    const otherLegsCount = legSizes.length > 1 ? legSizes.slice(1).reduce((a, b) => a + b.size, 0) : 0;

    return { 
        strongLeg: strongLegData.size, 
        otherLegs: otherLegsCount,
        strongLegId: strongLegData.userId,
        strongLegName: strongLegData.name
    };
};

// 🔥 MAIN REWARD DISTRIBUTION FUNCTION
const distributeMonthlyRewards = async () => {
    console.log('🏆 Starting Monthly Reward Distribution (With Double-Pay Protection)...');
    try {
        const now = new Date();
        
        // June 1 se June 30 tak ka time
        let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        let endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // July 1 (Current month start) - Ye double payment rokne ke kaam aayega
        let startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const allUsers = await User.find({ isToppedUp: true }).lean();

        for (let user of allUsers) {
            const legStats = await getMonthlyLegStats(user.userId, startOfLastMonth, endOfLastMonth);
            
            let highestEligibleReward = null;

            for (let i = REWARD_MILESTONES.length - 1; i >= 0; i--) {
                const milestone = REWARD_MILESTONES[i];
                if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
                    highestEligibleReward = milestone;
                    break;
                }
            }

            if (highestEligibleReward) {
                // 🔥 NAYA LOGIC: DOUBLE PAYMENT PROTECTION 🔥
                // Check karo ki kya is user ko is mahine (July me) pehle hi reward mil chuka hai?
                const alreadyPaid = await Transaction.findOne({
                    userId: user.userId,
                    type: "reward_income",
                    date: { $gte: startOfCurrentMonth } // Check if paid on or after July 1st
                });

                if (alreadyPaid) {
                    console.log(`⏩ Skipped User ${user.userId}: Already received reward for this month.`);
                    continue; // Skip kar do, aage mat badho
                }

                // Agar nahi mila hai, toh reward do
                const userDoc = await User.findOne({ userId: user.userId });
                
                userDoc.rewardIncome = (userDoc.rewardIncome || 0) + highestEligibleReward.reward;
                userDoc.totalRewardIncome = (userDoc.totalRewardIncome || 0) + highestEligibleReward.reward;
                await userDoc.save();

                await Transaction.create({
                    userId: userDoc.userId,
                    type: "reward_income",
                    source: "reward",
                    amount: highestEligibleReward.reward,
                    description: `Monthly Closing Reward: Achieved ${highestEligibleReward.title}`,
                    status: 'success',
                    date: new Date() // Aaj ki date (July 1)
                });

                console.log(`✅ Paid $${highestEligibleReward.reward} to User ${userDoc.userId} for Monthly Target.`);
            }
        }
        console.log('🎉 Monthly Reward Closing Completed Successfully!');
    } catch (err) {
        console.error('❌ Monthly Reward Cron Error:', err);
    }
};

// 🔥 Regular Cron Job (Har mahine ki 1 tareekh ko Raat 12:15 AM par)
cron.schedule('15 0 1 * *', async () => {
    await distributeMonthlyRewards();
});

// =========================================================================
// 🚀 EMERGENCY MANUAL TRIGGER: 
// Isko uncomment karke server restart karein bache hue logon ko reward dene ke liye.
// Jab sabko mil jaye, toh isko wapas comment (//) kar dena.
// =========================================================================

 setTimeout(() => {
    console.log("🛠️ Running Emergency Manual Trigger for Pending Rewards...");
    distributeMonthlyRewards();
}, 5000); // Server start hone ke 5 second baad chalega


module.exports = { getMonthlyLegStats, distributeMonthlyRewards };