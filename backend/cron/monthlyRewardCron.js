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

// 🔥 SUPERFAST LOGIC: N+1 Database Query Problem Solved!
const getMonthlyLegStats = async (sponsorId, startOfMonth, endOfMonth) => {
    // 1. 10,000 DB calls ki jagah, sirf 1 Call lagayenge aur sabko RAM (Memory) mein le aayenge.
    const allUsers = await User.find({}, 'userId name sponsorId isToppedUp topUpDate').lean();

    // 2. RAM (Memory) mein ek map banayenge jisse koi bhi downline INSTANTLY mil jayegi
    const userMap = new Map();
    for (let u of allUsers) {
        if (!userMap.has(u.sponsorId)) {
            userMap.set(u.sponsorId, []);
        }
        userMap.get(u.sponsorId).push(u);
    }

    // 3. Ab calculate karo (Yeh calculation RAM mein hogi, DB load nahi hoga)
    const directs = userMap.get(sponsorId) || [];
    let legSizes = [];

    for (let direct of directs) {
        let currentLegSize = 0;
        
        let queue = [direct.userId];
        while (queue.length > 0) {
            const currentId = queue.shift();
            // 🔥 DB QUERY HATA DI! Ab seedha Memory (Map) se utha rahe hain.
            const downlines = userMap.get(currentId) || []; 
            
            for (let d of downlines) {
                // Agar downline pichle mahine me active hui hai, toh point add karo
                if (d.isToppedUp && d.topUpDate >= startOfMonth && d.topUpDate <= endOfMonth) {
                    currentLegSize += 1; 
                }
                queue.push(d.userId); 
            }
        }
        
        // 🔥 YAHAN ID AUR NAAM SAVE HO RAHA HAI
        legSizes.push({ 
            size: currentLegSize, 
            userId: direct.userId, 
            name: direct.name 
        });
    }

    // 3. Descending order me sort (Jiska size sabse bada wo array mein sabse upar)
    legSizes.sort((a, b) => b.size - a.size);

    // Sabse badi value Strong Leg banegi
    const strongLegData = legSizes.length > 0 ? legSizes[0] : { size: 0, userId: null, name: null };
    
    // Baaki sabka sum Other Legs ban jayega
    const otherLegsCount = legSizes.length > 1 ? legSizes.slice(1).reduce((a, b) => a + b.size, 0) : 0;

    return { 
        strongLeg: strongLegData.size, 
        otherLegs: otherLegsCount,
        strongLegId: strongLegData.userId,     // ID bhej rahe hain
        strongLegName: strongLegData.name      // Name bhej rahe hain
    };
};

// 🔥 Ye Cron har mahine ki 1 tareekh ko Raat 12:15 AM par chalega ('15 0 1 * *')
cron.schedule('15 0 1 * *', async () => {
    console.log('🏆 Running Monthly Reward Cron Closing...');
    try {
        const now = new Date();
        
        // Pichle mahine ki start aur end date nikalna
        let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        let endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Saare Active users nikalo
        const allUsers = await User.find({ isToppedUp: true }).lean();

        for (let user of allUsers) {
            // Pichle mahine ka report card
            const legStats = await getMonthlyLegStats(user.userId, startOfLastMonth, endOfLastMonth);
            
            // Reverse loop taaki sabse bada (Highest) reward pehle mil jaye
            let highestEligibleReward = null;

            for (let i = REWARD_MILESTONES.length - 1; i >= 0; i--) {
                const milestone = REWARD_MILESTONES[i];
                if (legStats.strongLeg >= milestone.strongLeg && legStats.otherLegs >= milestone.otherLegs) {
                    highestEligibleReward = milestone;
                    break; // Jaise hi highest mila, baaki chote targets ignore kardo
                }
            }

            // Agar koi target hit hua hai, toh uska paisa de do
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