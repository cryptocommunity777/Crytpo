// C:\Users\HP\Desktop\Cryptocommunity\backend\cleanWallets.js

require('dotenv').config(); 
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Transaction = require('./models/Transaction');

const runWalletCleanup = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        
        // MongoDB se connect karein
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected Successfully!\n");

        console.log("🔍 Scanning users with saved wallet addresses...\n");

        // Sirf un users ko dhundho jinke paas wallet address set hai
        const usersWithWallets = await User.find({
            walletAddress: { $exists: true, $ne: "", $ne: null }
        });

        console.log(`📊 Total ${usersWithWallets.length} users found who have updated their wallet address.\n`);
        console.log("⚙️ Starting cleanup process...\n");

        let removedCount = 0;
        let keptCount = 0;
        let notToppedUpCount = 0;
        let noWithdrawalCount = 0;

        for (let user of usersWithWallets) {
            // Check karein ki kya is user ne kabhi withdrawal liya hai
            const hasWithdrawnTx = await Transaction.exists({
                userId: user.userId,
                type: { $in: ['withdrawal', 'withdraw', 'payout'] }
            });

            // Ek aur safety check in case Withdrawal table alag se ho
            let hasWithdrawnModel = false;
            try {
               hasWithdrawnModel = await mongoose.model('Withdrawal').exists({ userId: user.userId });
            } catch(e) {
               // Ignore agar model register na ho
            }

            const hasWithdrawn = hasWithdrawnTx || hasWithdrawnModel;

            let shouldRemove = false;
            let reason = "";

            // 🛑 RULE 1: Agar ID topup nahi hai
            if (!user.isToppedUp) {
                shouldRemove = true;
                reason = "ID Not Topped Up";
                notToppedUpCount++;
            } 
            // 🛑 RULE 2: Agar Topup hai, par kabhi withdrawal nahi liya
            else if (!hasWithdrawn) {
                shouldRemove = true;
                reason = "No Withdrawal Taken Yet";
                noWithdrawalCount++;
            }

            // Action: Remove or Keep
            if (shouldRemove) {
                // Database mein address update karke blank ("") kar do
                await User.updateOne({ _id: user._id }, { $set: { walletAddress: "" } });
                console.log(`🧹 Removed: ID #${user.userId} (${reason})`);
                removedCount++;
            } else {
                // Jinhone withdrawal liya hai unka safe rahega
                keptCount++;
            }
        }

        console.log(`\n🎉 WALLET CLEANUP COMPLETED!`);
        console.log(`=================================================`);
        console.log(`👥 Total Users Scanned       : ${usersWithWallets.length}`);
        console.log(`❌ Removed (Not Topped Up)   : ${notToppedUpCount}`);
        console.log(`❌ Removed (No Withdrawal)   : ${noWithdrawalCount}`);
        console.log(`✅ Total Addresses KEPT      : ${keptCount}`);
        console.log(`🚨 Total Addresses REMOVED   : ${removedCount}`);
        console.log(`=================================================\n`);

    } catch (err) {
        console.error('\n❌ Error running script:', err);
    } finally {
        console.log("🔌 Disconnecting Database...");
        await mongoose.disconnect();
        process.exit(0); 
    }
};

// 🔥 FIX: Sirf ye chalega ab
runWalletCleanup();