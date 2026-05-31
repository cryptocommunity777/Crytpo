// require('dotenv').config();
// const mongoose = require('mongoose');
// const readline = require('readline');

// // 🔥 Apne models ka sahi path yahan daalein
// const User = require('./models/User'); 
// const Withdrawal = require('./models/Withdrawal'); 
// const Transaction = require('./models/Transaction'); 

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// const runScript = async () => {
//     try {
//         console.log("⏳ Connecting to Database...");
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log("✅ Database Connected Successfully!\n");

//         // 🔍 STEP 1: LEADER USERS KO FIND KARNA
//         const leaders = await User.find({ role: 'leader' }); 

//         if (leaders.length === 0) {
//             console.log("⚠️ No leaders found in the database.");
//             process.exit(0);
//         }

//         let totalUsersToProcess = 0;
//         let totalAmountToDeduct = 0;
//         const usersToUpdate = [];

//         console.log("📊 --- PREVIEW: LEADER BALANCES --- 📊");

//         for (let user of leaders) {
//             const dInc = user.directIncome || 0;
//             const lInc = user.levelIncome || 0;
//             const rInc = user.rewardIncome || 0;
//             const pInc = user.poolIncome || 0;

//             const totalUserBalance = dInc + lInc + rInc + pInc;

//             if (totalUserBalance > 0) {
//                 totalUsersToProcess++;
//                 totalAmountToDeduct += totalUserBalance;
                
//                 usersToUpdate.push({
//                     user: user,
//                     balances: { direct: dInc, level: lInc, reward: rInc, pool: pInc },
//                     total: totalUserBalance
//                 });

//                 console.log(`👤 Leader ID: ${user.userId} | Name: ${user.name || 'N/A'}`);
//                 console.log(`   💰 To Deduct: $${totalUserBalance.toFixed(2)} (Direct: ${dInc}, Level: ${lInc}, Reward: ${rInc}, Pool: ${pInc})`);
//                 console.log("---------------------------------------------------");
//             }
//         }

//         if (totalUsersToProcess === 0) {
//             console.log("✅ All leaders already have $0 balance. Nothing to do.");
//             process.exit(0);
//         }

//         console.log(`\n🚨 SUMMARY: You are about to auto-withdraw from ${totalUsersToProcess} Leaders.`);
//         console.log(`💵 TOTAL AMOUNT TO ZERO OUT: $${totalAmountToDeduct.toFixed(2)}`);

//         // 🛑 STEP 2: CONFIRMATION PROMPT
//         rl.question("\n👉 Type 'yes' to confirm and proceed: ", async (answer) => {
//             if (answer.toLowerCase() === 'yes') {
//                 console.log("\n🚀 Executing Auto-Withdrawal...");

//                 for (let data of usersToUpdate) {
//                     const { user, balances, total } = data;

//                     const incomeSources = [
//                         { name: "direct", amt: balances.direct },
//                         { name: "level", amt: balances.level },
//                         { name: "reward", amt: balances.reward },
//                         { name: "pool", amt: balances.pool }
//                     ];

//                     for (let src of incomeSources) {
//                         if (src.amt > 0) {
                            
//                             // 🔥 NORMAL USER WALA MATH LOGIC (Taaki amount sahi dikhe)
//                             const withdrawShare = src.amt * 0.50;     // 50% Share
//                             const withdrawFee = withdrawShare * 0.10; // 10% Fee
//                             const netWithdrawAmount = withdrawShare - withdrawFee;

//                             // ✅ WALLET ADDRESS CHECK (Agar nahi hai toh "-" dalega)
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
//                                 remarks: "Leader Auto Settlement" // Admin identification ke liye (agar DB me field ho)
//                             });

//                             // ✅ Transaction History Record (Admin ko alag se dikhega "Leader Settlement")
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
                    
//                     user.totalWithdrawn = (user.totalWithdrawn || 0) + total;

//                     await user.save();
//                     console.log(`✅ Settled ID: ${user.userId}`);
//                 }

//                 console.log("\n🎉 ALL DONE! Leader balances zeroed out and records updated flawlessly.");
//             } else {
//                 console.log("\n❌ Action Cancelled. No changes were made.");
//             }

//             rl.close();
//             process.exit(0);
//         });

//     } catch (error) {
//         console.error("❌ ERROR:", error);
//         process.exit(1);
//     }
// };

// runScript();