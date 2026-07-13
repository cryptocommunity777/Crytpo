require('dotenv').config();
const mongoose = require('mongoose');

// Basic Schema (Strict false taaki sab fields easily access ho sakein)
const UserSchema = new mongoose.Schema({
    userId: Number,
    name: String,
    role: String,
    walletBalance: Number,
    usdtBep20Balance: Number
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function runScript() {
    try {
        console.log("⏳ Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected Successfully!\n");

        // 1. Sirf un Leaders ko dhundho jinke walletBalance mein kuch paisa hai (greater than 0)
        const leaders = await User.find({ 
            role: "leader", 
            walletBalance: { $gt: 0 } 
        });

        console.log(`🔎 Total Leaders found with pending Wallet Balance: ${leaders.length}\n`);

        if (leaders.length === 0) {
            console.log("👍 Koi action require nahi hai. Sabhi leaders ka wallet balance already 0 hai.");
            return;
        }

        let totalTransferredFund = 0;

        // 2. Har leader ke account mein transfer perform karo
        for (let leader of leaders) {
            const transferAmount = leader.walletBalance || 0;

            // Database mein atomic update ($inc for addition, $set to make wallet 0)
            await User.updateOne(
                { _id: leader._id },
                { 
                    $inc: { usdtBep20Balance: transferAmount }, // USDT mein plus karo
                    $set: { walletBalance: 0 }                  // Wallet ko 0 kar do
                }
            );

            totalTransferredFund += transferAmount;

            console.log(`✅ ID: ${leader.userId} | Name: ${leader.name || 'N/A'}`);
            console.log(`   ➡️ Transferred: $${transferAmount.toFixed(2)} to USDT BEP20 Balance.\n`);
        }

        // 3. Final Report
        console.log("==================================================");
        console.log(`🎉 SUCCESS! Transfer Complete.`);
        console.log(`👥 Total Leaders Updated: ${leaders.length}`);
        console.log(`💰 Total System Fund Transferred: $${totalTransferredFund.toFixed(2)}`);
        console.log("==================================================");

    } catch (error) {
        console.error("❌ Script Error:", error);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed.");
    }
}

runScript();