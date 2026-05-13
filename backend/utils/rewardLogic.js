const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ✅ COMMON TEAM RULES FOR ALL CATEGORIES
// Level | Direct Rank Req | Directs Needed | Downline Team Size (Excluding Directs)
const RANK_RULES = {
  1: { reqDirectRank: 0, reqDirectCount: 5, reqTeamSize: 10 },
  2: { reqDirectRank: 1, reqDirectCount: 2, reqTeamSize: 30 },
  3: { reqDirectRank: 1, reqDirectCount: 5, reqTeamSize: 150 },
  4: { reqDirectRank: 2, reqDirectCount: 2, reqTeamSize: 250 },
  5: { reqDirectRank: 2, reqDirectCount: 5, reqTeamSize: 1000 },
  6: { reqDirectRank: 3, reqDirectCount: 2, reqTeamSize: 3000 },
  7: { reqDirectRank: 3, reqDirectCount: 5, reqTeamSize: 5000 },
  8: { reqDirectRank: 4, reqDirectCount: 2, reqTeamSize: 10000 },
  9: { reqDirectRank: 4, reqDirectCount: 5, reqTeamSize: 25000 },
};

// ✅ CATEGORY CONFIGURATIONS
const REWARD_TRACKS = [
  {
    name: "Manager",
    prefix: "M",
    minPackage: 30, 
    rankField: "managerRank", 
    rewards: [0, 50, 150, 250, 500, 1000, 2500, 5000, 25000, 50000] 
  },
  {
    name: "Senior Manager",
    prefix: "SM",
    minPackage: 60, 
    rankField: "seniorManagerRank",
    rewards: [0, 100, 300, 500, 1000, 2000, 5000, 10000, 50000, 100000]
  },
  {
    name: "Executive Manager",
    prefix: "EM",
    minPackage: 120, 
    rankField: "executiveManagerRank",
    rewards: [0, 200, 600, 1000, 2000, 4000, 10000, 20000, 100000, 200000]
  }
];

// 🔹 HELPER: Count Total Downline (EXCLUDING DIRECT REFERRALS)
const calculateTeamSize = async (mainUserId, minAmount) => {
  let totalCount = 0;
  
  // Step 1: Get the immediate direct referrals of the user
  const directReferrals = await User.find({ sponsorId: mainUserId }, { userId: 1 });
  
  // Step 2: Put all directs into the queue, but DO NOT count them in totalCount
  let queue = directReferrals.map(d => d.userId);

  // Step 3: Loop to count everyone below the direct referrals (Level 2 and deeper)
  while (queue.length > 0) {
    const currentId = queue.shift();
    
    // Find users referred by the current person in the queue
    const teamMembers = await User.find({ sponsorId: currentId }, { userId: 1, topUpAmount: 1 });
    
    for (let member of teamMembers) {
      if ((member.topUpAmount || 0) >= minAmount) {
        totalCount++; // This only counts people from Level 2 onwards
      }
      queue.push(member.userId); 
    }
  }
  
  return totalCount;
};

// 🔹 MAIN FUNCTION: Check and Award All Categories
const checkAndAwardManagerReward = async (userId) => {
  try {
    const user = await User.findOne({ userId });
    if (!user) return;

    // Loop through each Track (Manager, Senior, Executive)
    for (let track of REWARD_TRACKS) {
      
      // 🛑 Condition 1: Check user's own package
      if ((user.topUpAmount || 0) < track.minPackage) {
         continue; 
      }

      // Check ranks sequentially from current rank to 9
      const currentRank = user[track.rankField] || 0;
      
      if (currentRank >= 9) continue; 

      // Team size calculates ONLY downline (excluding directs)
      const currentTeamSize = await calculateTeamSize(user.userId, track.minPackage);

      // Check targets for the next rank
      for (let targetRank = currentRank + 1; targetRank <= 9; targetRank++) {
        const rules = RANK_RULES[targetRank];
        
        // 1. Get Directs and their Rank
        const directs = await User.find({ sponsorId: user.userId, topUpAmount: { $gte: track.minPackage } });
        
        // Count how many directs meet the required rank
        const validDirectsCount = directs.filter(d => (d[track.rankField] || 0) >= rules.reqDirectRank).length;

        // ✅ If both conditions pass (Directs count + Downline Team Size)
      // ✅ If both conditions pass (Directs count + Downline Team Size)
        if (validDirectsCount >= rules.reqDirectCount && currentTeamSize >= rules.reqTeamSize) {
          
          const rewardAmount = track.rewards[targetRank];

          user.rewardIncome = (user.rewardIncome || 0) + rewardAmount;
          user.totalRewardIncome = (user.totalRewardIncome || 0) + rewardAmount; // ✅ ADD THIS LINE HERE
          user[track.rankField] = targetRank;
          
          const claimString = `${track.prefix}${targetRank}`;
          if (!user.claimedRewards) user.claimedRewards = [];
          if (!user.claimedRewards.includes(claimString)) {
            user.claimedRewards.push(claimString);
          }

          await user.save();

          await Transaction.create({
            userId: user.userId,
            type: "reward_income",
            source: `${track.prefix.toLowerCase()}_level_${targetRank}`,
            amount: rewardAmount,
            description: `Congratulations! You achieved ${track.name} ${targetRank} and earned $${rewardAmount} USDT Reward.`,
            createdAt: new Date(),
          });

          console.log(`✅ User ${user.userId} promoted to ${track.name} ${targetRank} and rewarded $${rewardAmount}`);
        } else {
          break; 
        }
      }
    }
  } catch (err) {
    console.error("Error in reward calculation:", err);
  }
};

module.exports = { checkAndAwardManagerReward };