// backend/services/balanceService.js
const Transaction = require("../models/Transaction");

async function calculateBalances(userId) {
  // Fetch all transactions for this user
  const transactions = await Transaction.find({ userId });

  // Wallet Balance = Deposits - Topups - Transfers
  let totalDeposits = 0;
  let totalTopups = 0;
  let totalTransfers = 0;

  // Withdrawable Balance = (Direct + Level  + ROI + Spin) - Withdrawals
  let totalDirect = 0;
  let totalLevel = 0;
    let totalROI = 0;
  let totalSpin = 0;
  let totalWithdrawals = 0;

  for (const tx of transactions) {
    switch (tx.type) {
      // wallet balance
      case "deposit":
        totalDeposits += tx.amount;
        break;
      case "topup":
        totalTopups += tx.amount;
        break;
      case "transfer":
        totalTransfers += tx.amount;
        break;

      // withdrawable balance incomes
      case "direct_income":
        totalDirect += tx.amount;
        break;
      case "level_income":
        totalLevel += tx.amount;
        break;
      case "roi_income":
        totalROI += tx.amount;
        break;
      case "spin_income":
        totalSpin += tx.amount;
        break;

      // withdrawal
      case "withdrawal":
        totalWithdrawals += tx.amount;
        break;
    }
  }

  const walletBalance = totalDeposits - totalTopups - totalTransfers;
  const withdrawableBalance =
    totalDirect + totalLevel  + totalROI + totalSpin - totalWithdrawals;

  return {
    walletBalance,
    withdrawableBalance,
    breakdown: {
      deposits: totalDeposits,
      topups: totalTopups,
      transfers: totalTransfers,
      directIncome: totalDirect,
      levelIncome: totalLevel,
      autopoolIncome: totalAutopool,
      roiIncome: totalROI,
      spinIncome: totalSpin,
      withdrawals: totalWithdrawals,
    },
  };
}

module.exports = calculateBalances;
