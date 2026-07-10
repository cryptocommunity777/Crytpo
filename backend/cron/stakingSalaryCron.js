const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const startStakingSalaryCron = () => {
    // Har raat 1:30 AM chalega (Qualification check karne aur 1 tareekh ko payout dene ke liye)
    cron.schedule('10 1 * * *', async () => {
        try {
            console.log("⏳ [CRON] Running CCT Monthly Salary Check & Payout...");
            const now = new Date();
            const isFirstOfMonth = now.getDate() === 1; // Check if aaj 1 tareekh hai

            // =======================================================================
            // 🔹 PART A: DAILY QUALIFICATION CHECK (Team & Directs calculate karna)
            // =======================================================================
            // Unko dhundo jinhone stake start kar diya hai aur Max Level (4) par nahi pahuche hain
            const usersToCheck = await User.find({ firstStakeDate: { $exists: true }, salaryLevel: { $lt: 4 } });

            for (const user of usersToCheck) {
                // Din calculate karo (Pehle stake se kitne din hue)
                const daysSinceFirstStake = (now - new Date(user.firstStakeDate)) / (1000 * 60 * 60 * 24);

                // Agar 60 din nikal gaye aur kuch achieve nahi kiya, toh aage check mat karo
                if (daysSinceFirstStake > 60) continue;

                // 🔥 MongoDB GraphLookup se poori Downline ek sath nikalna (Fast MLM Calculation)
                const agg = await User.aggregate([
                    { $match: { userId: user.userId } },
                    {
                        $graphLookup: {
                            from: "users",
                            startWith: "$userId",
                            connectFromField: "userId",
                            connectToField: "sponsorId",
                            as: "downline"
                        }
                    }
                ]);

                if (!agg || agg.length === 0) continue;
                const downline = agg[0].downline;
                
                const selfStake = user.totalCctStaked || 0;
                // Team Business = Downline ke har member ka stake sum
                const teamBusiness = downline.reduce((sum, member) => sum + (member.totalCctStaked || 0), 0);
                // Directs = Downline me jinka sponsor ye khud hai
                const directs = downline.filter(member => member.sponsorId === user.userId);

                let newLevel = user.salaryLevel;

                // 🚀 CHAMPION (Level 4): 60 Days, 1999 Self, 5x1999 Directs, 25000 Team
                const directs1999 = directs.filter(d => (d.totalCctStaked || 0) >= 1999).length;
                if (daysSinceFirstStake <= 60 && selfStake >= 1999 && directs1999 >= 5 && teamBusiness >= 25000) {
                    newLevel = 4;
                }
                // 👑 LEADER (Level 3): 45 Days, 1000 Self, 5x1000 Directs, 10000 Team
                else {
                    const directs1000 = directs.filter(d => (d.totalCctStaked || 0) >= 1000).length;
                    if (newLevel < 3 && daysSinceFirstStake <= 45 && selfStake >= 1000 && directs1000 >= 5 && teamBusiness >= 10000) {
                        newLevel = 3;
                    }
                }
                // 📈 BUILDER (Level 2): 30 Days, 500 Self, 5x500 Directs, 5000 Team
                if (newLevel < 2) {
                    const directs500 = directs.filter(d => (d.totalCctStaked || 0) >= 500).length;
                    if (daysSinceFirstStake <= 30 && selfStake >= 500 && directs500 >= 5 && teamBusiness >= 5000) {
                        newLevel = 2;
                    }
                }
                // 🚀 STARTER (Level 1): 10 Days, 100 Self, 5x100 Directs, 1000 Team
                if (newLevel < 1) {
                    const directs100 = directs.filter(d => (d.totalCctStaked || 0) >= 100).length;
                    if (daysSinceFirstStake <= 10 && selfStake >= 100 && directs100 >= 5 && teamBusiness >= 1000) {
                        newLevel = 1;
                    }
                }

                // Agar Level Upgrade hua hai, toh Database me save kar do
                if (newLevel > user.salaryLevel) {
                    user.salaryLevel = newLevel;
                    await user.save();
                    console.log(`🎉 User ${user.userId} achieved Salary Level ${newLevel}!`);
                }
            }

            // =======================================================================
            // 🔹 PART B: MONTHLY PAYOUT DISTRIBUTION (Sirf Mahine ki 1 Tareekh ko)
            // =======================================================================
          if (isFirstOfMonth) {
                console.log("💰 [CRON] It's the 1st of the month! Distributing Salaries...");
                
                // Unhe dhundo jinka level 0 se bada hai aur 24 mahine pure nahi hue
                const eligibleUsers = await User.find({ salaryLevel: { $gt: 0 }, salaryMonthsPaid: { $lt: 24 } });

                let payoutCount = 0;
                for (const user of eligibleUsers) {
                    let amountToPay = 0;
                    let rankName = "";
                    
                    if (user.salaryLevel === 1) { amountToPay = 100; rankName = "Starter"; }
                    else if (user.salaryLevel === 2) { amountToPay = 300; rankName = "Builder"; }
                    else if (user.salaryLevel === 3) { amountToPay = 600; rankName = "Leader"; }
                    else if (user.salaryLevel === 4) { amountToPay = 1000; rankName = "Champion"; }

                    if (amountToPay > 0) {
                        // 🔥 MAIN CHANGE YAHAN HAI: 
                        // Ab paisa 'walletBalance' me nahi, 'monthlySalaryWallet' me jayega
                        user.monthlySalaryWallet = (user.monthlySalaryWallet || 0) + amountToPay;
                        user.totalSalaryEarned = (user.totalSalaryEarned || 0) + amountToPay; // Total tracker
                        
                        user.salaryMonthsPaid = (user.salaryMonthsPaid || 0) + 1;
                        await user.save();

                        await Transaction.create({
                            userId: user.userId,
                            type: 'monthly_salary',
                            source: 'salary_wallet', // Source change kar diya
                            amount: amountToPay,
                            status: 'success',
                            description: `Monthly Salary (${rankName} Rank) added to Salary Wallet - Month ${user.salaryMonthsPaid} of 24`,
                            date: new Date()
                        });
                        payoutCount++;
                    }
                }
                console.log(`✅ [CRON] Monthly Salary distributed to ${payoutCount} achievers.`);
            }

        } catch (err) {
            console.error("❌ [CRON] Salary Cron Error:", err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
};

module.exports = startStakingSalaryCron;