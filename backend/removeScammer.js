const mongoose = require('mongoose');
const readline = require('readline'); // 🔥 Naya add kiya aapse YES/NO poochne ke liye
require('dotenv').config();

// 👇 Aapke /withdraw route ke hisaab se Models:
const User = require('./models/User'); 
const Withdrawal = require('./models/Withdrawal'); 
const Transaction = require('./models/Transaction'); 

// Aapka Database connection string yahan aayega (ya process.env.MONGO_URI use karein)
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/your_database_name"; 

const scammerAddress = "0x6943B1e4719c29C645cA04f75FffAd2dA3E7A028";

// User se terminal mein input lene ka setup
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function cleanScammerData() {
    try {
        console.log(`\n==========================================`);
        console.log(`🚨 SCAMMER CLEANUP SCRIPT (WITH CONFIRM) 🚨`);
        console.log(`==========================================\n`);
        
        await mongoose.connect(MONGO_URI);
        console.log(`✅ Database Connected Successfully.\n`);

        console.log(`🔍 Searching data for Scammer Address: ${scammerAddress}...\n`);

        // 1. Find all Fake Users with this wallet address
        const fakeUsers = await User.find({ walletAddress: scammerAddress });
        
        if (fakeUsers.length === 0) {
            console.log("✅ No fake users found with this address. Database is already clean!");
            process.exit(0);
        }

        const fakeUserIds = fakeUsers.map(u => u.userId);
        console.log(`⚠️  FOUND: ${fakeUsers.length} Fake User Accounts.`);

        // 2. Find Withdrawals (Pending/Success)
        const pendingWithdrawals = await Withdrawal.find({ userId: { $in: fakeUserIds } });
        console.log(`⚠️  FOUND: ${pendingWithdrawals.length} Withdrawal Requests.`);

        // 3. Find Transactions (Withdrawal logs, credits, topups)
        const transactions = await Transaction.find({ userId: { $in: fakeUserIds } });
        console.log(`⚠️  FOUND: ${transactions.length} Transaction Entries.\n`);

        console.log(`==========================================`);
        
        // 🔥 Yahan par script ruk jayegi aur aapse poochegi
        rl.question(`👉 Kya aap sach mein yeh saara data DELETE karna chahte hain? (yes / no): `, async (answer) => {
            
            // Agar aapne 'yes' ya 'y' type kiya
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                console.log(`\n🗑️  DELETING ALL FAKE DATA... PLEASE WAIT...\n`);

                const delWithdrawals = await Withdrawal.deleteMany({ userId: { $in: fakeUserIds } });
                console.log(`✅ DELETED: ${delWithdrawals.deletedCount} Withdrawal Requests.`);

                const delTransactions = await Transaction.deleteMany({ userId: { $in: fakeUserIds } });
                console.log(`✅ DELETED: ${delTransactions.deletedCount} Transaction Entries.`);

                const delUsers = await User.deleteMany({ userId: { $in: fakeUserIds } });
                console.log(`✅ DELETED: ${delUsers.deletedCount} Fake User Accounts.\n`);

                console.log(`==========================================`);
                console.log(`🎉 ALL SCAMMER DATA CLEARED SUCCESSFULLY! 🎉`);
                console.log(`==========================================\n`);
            } 
            // Agar aapne 'no' ya kuch aur type kiya
            else {
                console.log(`\n❌ Action Cancelled. Koi bhi data delete nahi hua hai. Aap safe hain!\n`);
            }

            // Script ko band kar do
            rl.close();
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ ERROR OCCURRED:", error);
        process.exit(1);
    }
}

cleanScammerData();