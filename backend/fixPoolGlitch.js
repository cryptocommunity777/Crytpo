// File Name: fixPoolGlitch.js 
require('dotenv').config();
const mongoose = require('mongoose');

// DHYAN DEIN: Agar aapke models kisi 'models' folder me hain, toh path sahi rakhna
const User = require('./models/User'); 
const Transaction = require('./models/Transaction'); 

const runRecoveryScript = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        
        // 🔥 YAHAN FIX KIYA HAI: Naye Mongoose me purane options ki zaroorat nahi hoti
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("✅ Database Connected Successfully!\n");

        console.log("🚀 Starting Pool Glitch Recovery Audit...");

        // Sirf unko check karenge jinki ID active hai
        const users = await User.find({ isToppedUp: true });
        let fixedCount = 0;
        let totalRecovered = 0;

        for (let user of users) {
            // Step A: Calculate Total Earned (System ne pool ka kitna paisa diya)
            const earnedTxns = await Transaction.find({
                userId: user.userId,
                type: "credit",
                source: "pool",
                status: "success"
            });
            const earnedPool = earnedTxns.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

            // Step B: Calculate Total Spent (User ne withdraw ya credit-to-wallet kitna kiya)
            // Gross amount use kar rahe hain kyunki wahi pool se minus hona chahiye tha
            const spentTxns = await Transaction.find({
                userId: user.userId,
                type: { $in: ["credit_to_wallet", "withdrawal"] },
                source: "pool"
            });
            const spentPool = spentTxns.reduce((sum, tx) => sum + parseFloat(tx.grossAmount || tx.amount || 0), 0);

            // Step C: Calculate Asli (True) Pool Balance
            const truePoolBalance = earnedPool - spentPool;

            let needsSave = false;

            // 🚨 GLITCH CATCHER: Agar user ne kamaya kam aur nikal zyada liya!
            if (truePoolBalance < 0) {
                const extraTaken = Math.abs(truePoolBalance);

                // 1. Uska Pool Balance wapas Zero karo
                user.poolIncome = 0;

                // 2. Jitna extra usne liya hai, wo uske Main Wallet Balance se Minus karo
                user.walletBalance = (user.walletBalance || 0) - extraTaken;

                console.log(`⚠️ THIEF CAUGHT: User ID ${user.userId} took $${extraTaken} extra. Deducted from Main Wallet!`);

                totalRecovered += extraTaken;
                needsSave = true;
            } 
            // Agar calculation me thoda difference hai par minus me nahi gaya (DB Sync issue)
            else if (parseFloat((user.poolIncome || 0).toFixed(2)) !== parseFloat(truePoolBalance.toFixed(2))) {
                user.poolIncome = truePoolBalance;
                needsSave = true;
            }

            // Agar koi bhi change hua hai, toh Database me save kar do
            if (needsSave) {
                await user.save();
                fixedCount++;
            }
        }

        console.log("\n=========================================");
        console.log(`✅ AUDIT & RECOVERY COMPLETE!`);
        console.log(`👨‍🔧 Total Users Fixed: ${fixedCount}`);
        console.log(`💰 Total Extra Funds Recovered: $${totalRecovered}`);
        console.log("=========================================\n");

        // Script ka kaam khatam, gracefully exit
        process.exit(0);

    } catch (error) {
        console.error("❌ Script Failed:", error);
        process.exit(1);
    }
};

runRecoveryScript();