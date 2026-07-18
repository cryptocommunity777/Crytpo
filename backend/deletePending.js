const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// 👇 Sirf Withdrawal model ki zaroorat hai ab
const Withdrawal = require('./models/Withdrawal'); 

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/your_database_name"; 
const scammerAddress = "0x6943B1e4719c29C645cA04f75FffAd2dA3E7A028";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function cleanPendingWithdrawals() {
    try {
        console.log(`\n==========================================`);
        console.log(`🚨 PENDING WITHDRAWAL CLEANUP SCRIPT 🚨`);
        console.log(`==========================================\n`);
        
        await mongoose.connect(MONGO_URI);
        console.log(`✅ Database Connected Successfully.\n`);

        console.log(`🔍 Searching PENDING withdrawals for Scammer Address: ${scammerAddress}...\n`);

        // 🔥 Filter: Address match hona chahiye AUR status 'pending' hona chahiye
        const queryFilter = { 
            walletAddress: scammerAddress, 
            status: "pending" 
        };

        const pendingWithdrawals = await Withdrawal.find(queryFilter);
        
        if (pendingWithdrawals.length === 0) {
            console.log("✅ Is address par koi bhi PENDING withdrawal nahi mili. Sab theek hai!");
            process.exit(0);
        }

        console.log(`⚠️  FOUND: ${pendingWithdrawals.length} PENDING Withdrawal Requests.\n`);
        console.log(`==========================================`);
        
        // 🔥 Confirm karne ke liye rok diya
        rl.question(`👉 Kya aap sach mein in ${pendingWithdrawals.length} PENDING withdrawals ko DELETE karna chahte hain? (yes / no): `, async (answer) => {
            
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                console.log(`\n🗑️  DELETING PENDING WITHDRAWALS... PLEASE WAIT...\n`);

                const result = await Withdrawal.deleteMany(queryFilter);
                
                console.log(`✅ DELETED: ${result.deletedCount} Pending Withdrawals Successfully.\n`);
            } 
            else {
                console.log(`\n❌ Action Cancelled. Koi bhi data delete nahi hua hai.\n`);
            }

            rl.close();
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ ERROR OCCURRED:", error);
        process.exit(1);
    }
}

cleanPendingWithdrawals();