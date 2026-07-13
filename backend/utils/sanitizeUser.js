// C:\Users\HP\Desktop\Cryptocommunity\backend\utils\sanitizeUser.js

module.exports = function sanitizeUser(user) {
  if (!user) return null;

  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    mobile: user.mobile, 
    role: user.role,
    sponsorId: user.sponsorId,
    
    // 🛡️ WALLET & SECURITY
    walletAddress: user.walletAddress || "", 
    walletAddressChangeCount: user.walletAddressChangeCount || 0,
    walletAddressChangeWindowStart: user.walletAddressChangeWindowStart,
    walletAddressHistory: user.walletAddressHistory || [], 
    pendingWithdrawals: user.pendingWithdrawals || 0,

    // 💰 WALLET BALANCES
    walletBalance: user.walletBalance || 0,
    usdtBep20Balance: user.usdtBep20Balance || 0, 
    directIncome: user.directIncome || 0,
    levelIncome: user.levelIncome || 0,
    totalLevelIncome: user.totalLevelIncome || 0, 
    poolIncome: user.poolIncome || 0,
    rewardIncome: user.rewardIncome || 0,
    totalWithdrawn: user.totalWithdrawn || 0,

    // 🔥 NAYA: STAKING INCOMES YAHAN ADD KI HAIN 🔥
    cctStakingIncome: user.cctStakingIncome || 0,
    cctStakingDirectIncome: user.cctStakingDirectIncome || 0,
    cctStakingLevelIncome: user.cctStakingLevelIncome || 0,

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

    // 🌊 POOL DATA 
    activePools: user.activePools || [] 
  };
};