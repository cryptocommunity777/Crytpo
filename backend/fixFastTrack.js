// C:\Users\HP\Desktop\Cryptocommunity\backend\fixFastTrack.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function fixPastIncomes() {
    try {
        console.log("🔄 Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptocommunity");
        console.log("✅ Connected! Scanning past Fast Track transactions...\n");

        // 1. Saari success 'fast_track' entries uthao
        const allFastTrackTxs = await Transaction.find({ type: 'fast_track', status: 'success' });

        if (allFastTrackTxs.length === 0) {
            console.log("⚠️ Koi purani Fast Track entry nahi mili.");
            process.exit();
        }

        // 2. Har user ka total hisaab lagao
        const userTotals = {};
        
        allFastTrackTxs.forEach(tx => {
            const uid = tx.userId;
            
            // Amount nikalne ka safe tarika (kabhi Decimal128 hota hai, kabhi Number)
            let amt = 0;
            if (tx.amount && tx.amount.$numberDecimal) {
                amt = parseFloat(tx.amount.$numberDecimal);
            } else {
                amt = parseFloat(tx.amount) || 0;
            }

            if (!userTotals[uid]) {
                userTotals[uid] = 0;
            }
            userTotals[uid] += amt;
        });

        console.log(`📊 Found ${allFastTrackTxs.length} transactions belonging to ${Object.keys(userTotals).length} users.`);
        console.log("🚀 Updating User Models now...\n");

        // 3. Har User ka Model update karo
        let updatedCount = 0;
        for (const [uid, totalAmount] of Object.entries(userTotals)) {
            const result = await User.updateOne(
                { userId: Number(uid) },
                { 
                    $set: { 
                        fastTrackIncome: totalAmount,
                        totalFastTrackIncome: totalAmount
                    } 
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ User ${uid}: Fixed! Total Fast Track Income set to $${totalAmount}`);
                updatedCount++;
            }
        }

        console.log(`\n🎉 BINGO! Successfully updated ${updatedCount} users' profiles.`);
        
    } catch (err) {
        console.error("❌ Error during fix:", err);
    } finally {
        console.log("🛑 Disconnecting Database...");
        mongoose.disconnect();
        process.exit();
    }
}

fixPastIncomes();