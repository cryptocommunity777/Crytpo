// C:\Users\HP\Desktop\Cryptocommunity\backend\utils\sanitizeUser.js
module.exports = function sanitizeUser(user) {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    walletBalance: user.walletBalance,
    isTelegramJoined: user.isTelegramJoined, 
    isToppedUp: user.isToppedUp,
    topUpAmount: user.topUpAmount,
    sponsorId: user.sponsorId,
    role: user.role,
    profileImage: user.profileImage,
    topUpDate: user.topUpDate,
    hasTopup: user.hasTopup,
    levelStatus: user.levelStatus,

    // 🔥 MAIN FIX: Ye sab missing tha!
    globalTeamCount: user.globalTeamCount, // 👈 My Community ke liye
    directCount: user.directCount,         // 👈 Direct Referrals ke liye

    // 💰 INCOME BALANCES (Ye bhi add kar lo, warna dashboard me income bhi show nahi hogi)
    directIncome: user.directIncome,
    levelIncome: user.levelIncome,
    poolIncome: user.poolIncome,
    rewardIncome: user.rewardIncome,
    totalWithdrawn: user.totalWithdrawn
  };
};