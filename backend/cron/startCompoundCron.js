// const cron = require('node-cron');
// const User = require('../models/User'); 
// const Transaction = require('../models/Transaction');

// const startCompoundCron = () => {
//     // Har raat 12:40 AM IST par chalega (Purane wale se 10 minute baad taaki server par load na aaye)
//     cron.schedule('40 0 * * *', async () => {
//         try {
//             console.log("⏳ [CRON] Running CCT 40-Days Compounding Daily Distribution...");
            
//             const now = new Date();
//             const formatter = new Intl.DateTimeFormat('en-US', { 
//                 timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' 
//             });
//             const parts = formatter.formatToParts(now);
//             let month, day, year;
//             for (let p of parts) {
//                 if (p.type === 'month') month = p.value;
//                 if (p.type === 'day') day = p.value;
//                 if (p.type === 'year') year = p.value;
//             }
//             const startOfTodayIST = new Date(`${year}-${month}-${day}T00:00:00+05:30`);

//             // Un users ko dhundo jinke paas compound stakes hain
//             const users = await User.find({ "compoundStakes.0": { $exists: true } });

//             if (users.length === 0) {
//                 console.log("✅ [CRON] No eligible users found for Compounding today.");
//                 return;
//             }

//             let successCount = 0;
//             let skippedCount = 0;

//             for (let user of users) {
                
//                 // Double payment protection
//                 const alreadyPaidToday = await Transaction.findOne({
//                     userId: user.userId,
//                     type: 'cct_compound_daily_income',
//                     date: { $gte: startOfTodayIST }
//                 });

//                 if (alreadyPaidToday) {
//                     skippedCount++;
//                     continue; 
//                 }

//                 let totalDailyPayout = 0;
//                 let activeStakesCount = 0;

//                 for (let stake of user.compoundStakes) {
//                     if (stake.status === 'completed' || stake.earned >= stake.maxCap) {
//                         stake.status = 'completed';
//                         continue;
//                     }

//                     // 3% daily rate logic
//                     const ratePercent = Number(stake.dailyRate) || 3.0;
//                     const dailyIncome = stake.amount * (ratePercent / 100); 

//                     const remainingCap = stake.maxCap - stake.earned;
//                     const actualPayout = dailyIncome > remainingCap ? remainingCap : dailyIncome;

//                     if (actualPayout > 0) {
//                         stake.earned += actualPayout;
//                         totalDailyPayout += actualPayout;
                        
//                         if (stake.earned >= stake.maxCap) {
//                             stake.status = 'completed';
//                         } else {
//                             activeStakesCount++; 
//                         }
//                     }
//                 }

//                 if (totalDailyPayout > 0) {
//                     // Update New Separate Wallet
//                     user.cctCompoundIncome = (user.cctCompoundIncome || 0) + totalDailyPayout;
                    
//                     user.markModified('compoundStakes');
//                     await user.save();

//                     await Transaction.create({
//                         userId: user.userId, 
//                         type: 'cct_compound_daily_income', 
//                         source: 'compound',
//                         amount: totalDailyPayout, 
//                         status: 'success',
//                         description: `Daily CCT Compounding ROI (3%).`, 
//                         date: new Date()
//                     });

//                     successCount++;
//                 }
//             }
            
//             console.log(`✅ [CRON] Compounding ROI successfully distributed to ${successCount} users. (Skipped ${skippedCount}).`);
//         } catch (err) {
//             console.error("❌ [CRON] Compounding Cron Error:", err);
//         }
//     }, {
//         scheduled: true,
//         timezone: "Asia/Kolkata" 
//     });
// };

// module.exports = startCompoundCron;