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
  { target: 21750, strongLeg: 10875, otherLegs: 10875, reward: 3000, title: "Target 8 (21750 Points)" }
];

// 🔥 Naya Hisaab: Sirf Direct ke neeche ki team (downline) count hogi!
const getMonthlyLegStats = async (sponsorId, startOfMonth, endOfMonth) => {
    // 1. Pehle user ke saare Directs nikalo (Ye har ek direct ek alag 'Leg' hai)
    const directs = await User.find({ sponsorId: sponsorId }, 'userId isToppedUp topUpDate').lean();
    let legSizes = [];

    for (let direct of directs) {
        let currentLegSize = 0;
        
        // 🛑 YAHAN SE DIRECT KA COUNT HATA DIYA GAYA HAI
        // Ab direct ka apna top-up leg size mein nahi judega.

        // 2. Sirf Direct ki Downline (Neeche ki team) search hogi
        let queue = [direct.userId];
        while (queue.length > 0) {
            const currentId = queue.shift();
            // .lean() lagane se query 3x fast ho jayegi
            const downlines = await User.find({ sponsorId: currentId }, 'userId isToppedUp topUpDate').lean();
            
            for (let d of downlines) {
                // Agar downline pichle mahine me active hui hai, toh point add karo
                if (d.isToppedUp && d.topUpDate >= startOfMonth && d.topUpDate <= endOfMonth) {
                    currentLegSize += 1; 
                }
                queue.push(d.userId); // Aur uske neeche ke logo ko bhi queue mein dalo
            }
        }
        // Is ek particular leg ka total size save kar lo
        legSizes.push(currentLegSize);
    }

    // 3. Descending order me sort karo taaki sabse badi leg pehle aa jaye
    legSizes.sort((a, b) => b - a);

    // Sabse badi value Strong Leg ban jayegi, aur baaki sabka sum Other Legs ban jayega
    const strongLegCount = legSizes.length > 0 ? legSizes[0] : 0;
    const otherLegsCount = legSizes.length > 1 ? legSizes.slice(1).reduce((a, b) => a + b, 0) : 0;

    return { 
        strongLeg: strongLegCount, 
        otherLegs: otherLegsCount
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
                // User model ko wapas fetch karna padega kyunki upar .lean() use kiya tha
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