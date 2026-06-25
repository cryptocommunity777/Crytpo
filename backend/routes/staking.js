// // routes/staking.js
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const Transaction = require('../models/Transaction');
// const authMiddleware = require('../middleware/authMiddleware');

// // 1. Get Staking Stats
// router.get('/stats', authMiddleware, async (req, res) => {
//     try {
//         const user = await User.findOne({ userId: req.user.userId }).select('walletBalance cctBalance cctStakingIncome totalCctStaked stakedMaxCap stakedEarned isStaked');
//         res.json({ success: true, data: user });
//     } catch (err) {
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// });

// // 2. Convert Wallet Balance to CCT (100% conversion)
// router.post('/convert', authMiddleware, async (req, res) => {
//     try {
//         const { amount, transactionPassword } = req.body;
//         const user = await User.findOne({ userId: req.user.userId });
        
//         if (!user) return res.status(404).json({ message: "User not found" });
//         if (user.transactionPassword.toLowerCase() !== transactionPassword.toLowerCase()) return res.status(400).json({ message: "Invalid Transaction Password" });
//         if (amount < 1) return res.status(400).json({ message: "Invalid amount" });
//         if (user.walletBalance < amount) return res.status(400).json({ message: "Insufficient Wallet Balance" });

//         user.walletBalance -= amount;
//         user.cctBalance += amount;
//         await user.save();

//         await Transaction.create({
//             userId: user.userId, type: 'convert_to_cct', amount: amount, status: 'success',
//             description: `Converted $${amount} Wallet Balance to ${amount} CCT`, date: new Date()
//         });

//         res.json({ success: true, message: `Successfully converted $${amount} to CCT.` });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // 3. Stake CCT (Self or Downline)
// router.post('/stake', authMiddleware, async (req, res) => {
//     try {
//         const { targetUserId, amount, transactionPassword } = req.body;
//         const user = await User.findOne({ userId: req.user.userId });
//         const targetUser = await User.findOne({ userId: targetUserId });

//         if (!user) return res.status(404).json({ message: "Sender not found" });
//         if (!targetUser) return res.status(404).json({ message: "Target User ID not found" });
//         if (user.transactionPassword.toLowerCase() !== transactionPassword.toLowerCase()) return res.status(400).json({ message: "Invalid Password" });
        
//         const stakeAmt = Number(amount);
//         if (stakeAmt < 100 || stakeAmt > 1999) return res.status(400).json({ message: "Staking amount must be between 100 and 1999 CCT." });
//         if (user.cctBalance < stakeAmt) return res.status(400).json({ message: "Insufficient CCT Balance" });
//         if (targetUser.isStaked) return res.status(400).json({ message: "This ID is already staked. Only 1 stake allowed per ID." });

//         // Calculate Max Cap based on conditions
//         let maxCap = 0;
//         if (stakeAmt >= 100 && stakeAmt <= 499) maxCap = stakeAmt * 3;
//         else if (stakeAmt >= 500 && stakeAmt <= 999) maxCap = stakeAmt * 4;
//         else if (stakeAmt >= 1000 && stakeAmt <= 1999) maxCap = stakeAmt * 5;

//         // Deduct from sender, apply to target
//         user.cctBalance -= stakeAmt;
//         if (user.userId !== targetUser.userId) await user.save(); // Agar kisi aur ka kar raha hai toh sender save karo

//         targetUser.isStaked = true;
//         targetUser.totalCctStaked = stakeAmt;
//         targetUser.stakedMaxCap = maxCap;
//         targetUser.stakedEarned = 0;
//         await targetUser.save();

//         await Transaction.create({
//             userId: user.userId, type: 'cct_stake_send', amount: stakeAmt, status: 'success',
//             description: `Staked ${stakeAmt} CCT for ID #${targetUser.userId}`, date: new Date()
//         });

//         res.json({ success: true, message: `Successfully staked ${stakeAmt} CCT for ID #${targetUser.userId}` });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // 4. Withdraw CCT Income (50-50 Split Rule)
// router.post('/withdraw', authMiddleware, async (req, res) => {
//     try {
//         const { amount, transactionPassword } = req.body;
//         const user = await User.findOne({ userId: req.user.userId });

//         if (user.transactionPassword.toLowerCase() !== transactionPassword.toLowerCase()) return res.status(400).json({ message: "Invalid Password" });
//         if (amount < 10) return res.status(400).json({ message: "Minimum withdrawal is 10" });
//         if (user.cctStakingIncome < amount) return res.status(400).json({ message: "Insufficient Staking Income" });

//         const withdrawAmt = Number(amount);
        
//         // 50-50 Split
//         const toMainWallet = withdrawAmt * 0.50;
//         const toCctWallet = withdrawAmt * 0.50;

//         // 10% Fee on both
//         const finalMainWallet = toMainWallet - (toMainWallet * 0.10);
//         const finalCctWallet = toCctWallet - (toCctWallet * 0.10);

//         // Deduct and Add
//         user.cctStakingIncome -= withdrawAmt;
//         user.walletBalance += finalMainWallet; // 45% Withdraw able
//         user.cctBalance += finalCctWallet;   // 45% Re-stake able
//         await user.save();

//         await Transaction.create({
//             userId: user.userId, type: 'cct_withdraw', amount: withdrawAmt, status: 'success',
//             description: `Withdrew ${withdrawAmt} CCT Staking Income. Added $${finalMainWallet} to Wallet & ${finalCctWallet} to CCT after 10% fee.`, date: new Date()
//         });

//         res.json({ success: true, message: `Withdrawal successful! $${finalMainWallet} added to Main Wallet, ${finalCctWallet} CCT added to CCT Wallet.` });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// module.exports = router;