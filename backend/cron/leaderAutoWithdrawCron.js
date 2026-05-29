// const cron = require('node-cron');
// const User = require('../models/User'); // Apne hisaab se path adjust kar lena
// const Withdrawal = require('../models/Withdrawal'); 
// const Transaction = require('../models/Transaction'); 

// const startLeaderAutoWithdrawCron = () => {
//     // 🔥 CRON TIMING: '30 23 * * *' ka matlab hai roz raat 11:30 PM (IST) par chalega.
//     // Agar raat 12 baje chalana hai toh '0 0 * * *' kar dena.
//     cron.schedule('30 23 * * *', async () => {
//         console.log("⏳ [CRON] Starting Daily Leader Auto-Withdrawal...");
//         try {
//             // 🔍 STEP 1: LEADER USERS KO FIND KARNA
//             const leaders = await User.find({ role: 'leader' }); 

//             if (leaders.length === 0) {
//                 console.log("⚠️ [CRON] No leaders found in the database.");
//                 return;
//             }

//             let totalUsersProcessed = 0;
//             let totalAmountDeducted = 0;

//             for (let user of leaders) {
//                 const dInc = user.directIncome || 0;
//                 const lInc = user.levelIncome || 0;
//                 const rInc = user.rewardIncome || 0;
//                 const pInc = user.poolIncome || 0;

//                 const totalUserBalance = dInc + lInc + rInc + pInc;

//                 if (totalUserBalance > 0) {
//                     const incomeSources = [
//                         { name: "direct", amt: dInc },
//                         { name: "level", amt: lInc },
//                         { name: "reward", amt: rInc },
//                         { name: "pool", amt: pInc }
//                     ];

//                     for (let src of incomeSources) {
//                         if (src.amt > 0) {
                            
//                             // 🔥 NORMAL USER WALA MATH LOGIC (Taaki amount sahi dikhe)
//                             const withdrawShare = src.amt * 0.50;     // 50% Share
//                             const withdrawFee = withdrawShare * 0.10; // 10% Fee
//                             const netWithdrawAmount = withdrawShare - withdrawFee;

//                             // ✅ WALLET ADDRESS CHECK
//                             const finalAddress = user.walletAddress && user.walletAddress.trim() !== "" 
//                                 ? user.walletAddress 
//                                 : "-";

//                             // ✅ Withdrawal Record
//                             await Withdrawal.create({
//                                 userId: user.userId,
//                                 source: src.name,
//                                 grossAmount: withdrawShare,
//                                 fee: withdrawFee, 
//                                 netAmount: netWithdrawAmount,
//                                 walletAddress: finalAddress, 
//                                 status: "approved", 
//                                 date: new Date(),
//                                 remarks: "Leader Auto Settlement" 
//                             });

//                             // ✅ Transaction History Record
//                             await Transaction.create({
//                                 userId: user.userId,
//                                 type: "withdrawal",
//                                 source: src.name,
//                                 amount: withdrawShare,
//                                 description: `Leader Settlement: Withdrawal from ${src.name.toUpperCase()}`,
//                                 status: "approved"
//                             });
//                         }
//                     }

//                     // User ke sabhi income boxes ko 0 kar diya
//                     user.directIncome = 0;
//                     user.levelIncome = 0;
//                     user.rewardIncome = 0;
//                     user.poolIncome = 0;
//                     user.totalWithdrawn = (user.totalWithdrawn || 0) + totalUserBalance;

//                     await user.save();
//                     totalUsersProcessed++;
//                     totalAmountDeducted += totalUserBalance;
//                     console.log(`✅ [CRON] Settled Leader ID: ${user.userId} | Amount: $${totalUserBalance.toFixed(2)}`);
//                 }
//             }

//             console.log(`🎉 [CRON] DONE! Processed ${totalUsersProcessed} Leaders. Total Deducted: $${totalAmountDeducted.toFixed(2)}`);

//         } catch (error) {
//             console.error("❌ [CRON] ERROR in Leader Auto-Withdrawal:", error);
//         }
//     }, {
//         scheduled: true,
//         timezone: "Asia/Kolkata" // India ke time ke hisaab se chalega
//     });
// };

// module.exports = startLeaderAutoWithdrawCron;