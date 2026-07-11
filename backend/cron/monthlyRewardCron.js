// C:\Users\HP\Desktop\Cryptocommunity\backend\cron\monthlyRewardCron.js
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

// 🔥 SUPERFAST LOGIC + ABSOLUTE BREAKAWAY WITH SUPER LEADER BYPASS
const getMonthlyLegStats = async (sponsorId, startOfMonth, endOfMonth, isSuperLeader = false) => {
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
            
            // 🛑 ABSOLUTE BREAKAWAY WALL WITH BYPASS:
            // Agar yeh banda Leader hai AUR jiska count nikal raha hai wo Super Leader NAHI hai, toh ruk jao.
            if (currentUserNode.role === 'leader' && !isSuperLeader) {
               continue; 
            }

            // Agar Leader nahi hai ya fir Super Leader search kar raha hai, toh iski downline uthao
            const downlines = userMap.get(currentUserNode.userId) || []; 
            for (let d of downlines) {
                // 🔥 FIX EXACTLY LIKE ADMIN: Point counting yahan downlines par lagayi hai.
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

// 🔥 Ye Cron har mahine ki 1 tareekh ko Raat 12:15 AM par chalega ('15 0 1 * *')
cron.schedule('15 0 1 * *', async () => {
    console.log('🏆 Running Monthly Reward Cron Closing...');
    try {
        const now = new Date();
        
        let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        let endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const allUsers = await User.find({ isToppedUp: true }).lean();

        for (let user of allUsers) {
            // 🔥 Yahan Cron check kar raha hai ki user superleader hai ya nahi
            const isSuperLeader = user.role === 'superleader';
            
            const legStats = await getMonthlyLegStats(user.userId, startOfLastMonth, endOfLastMonth, isSuperLeader);
            
            let highestEligibleReward = null;

            for (let i = REWARD_MILESTONES.length - 1; i >= 0; i--) {
                const milestone = REWARD_MILESTONES[i];
                if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
                    highestEligibleReward = milestone;
                    break;
                }
            }

            if (highestEligibleReward) {
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
                    date: new Date()
                });

                console.log(`✅ Paid $${highestEligibleReward.reward} to User ${userDoc.userId} for Monthly Target.`);
            }
        }
        console.log('🎉 Monthly Reward Closing Completed Successfully!');
    } catch (err) {
        console.error('❌ Monthly Reward Cron Error:', err);
    }
});

module.exports = { getMonthlyLegStats };