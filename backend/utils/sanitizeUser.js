// C:\Users\HP\Desktop\Cryptocommunity\backend\utils\sanitizeUser.js

module.exports = function sanitizeUser(user) {
  if (!user) return null;

  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    mobile: user.mobile, // 👈 Profile ke liye zaroori hai
    role: user.role,
    sponsorId: user.sponsorId,
    
    // 🛡️ WALLET & SECURITY (Ye missing tha, isliye refresh par udd raha tha)
    walletAddress: user.walletAddress || "", 
    walletAddressChangeCount: user.walletAddressChangeCount || 0,
    walletAddressChangeWindowStart: user.walletAddressChangeWindowStart,
    
    // 🔥 YAHI MISSING THA: Frontend pe history isiliye gayab ho rahi thi 🔥
    walletAddressHistory: user.walletAddressHistory || [], 
    
    pendingWithdrawals: user.pendingWithdrawals || 0,

    // 💰 WALLET BALANCES
    walletBalance: user.walletBalance || 0,
    usdtBep20Balance: user.usdtBep20Balance || 0, // 🔥 YE LINE ADD KIJIYE
    directIncome: user.directIncome || 0,
    levelIncome: user.levelIncome || 0,
    totalLevelIncome: user.totalLevelIncome || 0, // 👈 YE MISSING THA!
    poolIncome: user.poolIncome || 0,
    rewardIncome: user.rewardIncome || 0,
    totalWithdrawn: user.totalWithdrawn || 0,

    // 🚀 TOPUP & STATUS
    isToppedUp: user.isToppedUp,
    topUpAmount: user.topUpAmount,
    topUpDate: user.topUpDate,
    hasTopup: user.hasTopup,
    levelStatus: user.levelStatus,
    isTelegramJoined: user.isTelegramJoined,

    // 👥 TEAM DATA
    globalTeamCount: user.globalTeamCount || 0,
    directCount: user.directCount || 0,

    // 🌊 POOL DATA (Jo humne abhi Modal me theek kiya tha)
    activePools: user.activePools || [] 
  };
};