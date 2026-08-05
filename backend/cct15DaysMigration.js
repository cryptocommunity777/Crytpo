// C:\Users\HP\Desktop\Cryptocommunity\backend\cct15DaysMigration.js

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const fs = require('fs'); 
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
};

const runMigration = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected Successfully!\n");

        console.log("🚀 Scanning eligible users (Non-Stakers, Not Leaders)... Please wait.\n");

        // 🔥 STEP 1: Sirf un users ko dhundo jinke paas CCT hai aur wo Leader/Super Leader NAHI hain
        const eligibleUsers = await User.find({ 
            cctBalance: { $gt: 0 },
            role: { $nin: ['leader', 'super_leader', 'Leader', 'Super Leader', 'LEADER', 'SUPER_LEADER'] } 
        });

        let pendingTransfers = [];
        let totalCctToMove = 0;

        for (let user of eligibleUsers) {
            // 🔥 STAKE CHECK: Yahan check kar rahe hain ki user ne stake kiya hai ya nahi.
            // NOTE: Aapke DB me staking ka jo bhi field hai (jaise 'totalStaked', 'isStaked' ya 'activeStake'), usko yahan use karein.
            // Abhi maine assume kiya hai ki agar totalStaked 0 se bada hai, toh usne stake kiya hai.
            const hasStaked = user.totalStaked > 0 || user.isStaked === true; 

            // Agar user ne stake kiya hai, toh isko skip kar do (kuch nahi karna hai)
            if (hasStaked) {
                continue; 
            }

            // Jinhone stake nahi kiya, unka pura CCT utha lo
            let amountToMove = user.cctBalance;

            if (amountToMove > 0) {
                pendingTransfers.push({
                    userId: user.userId,
                    name: user.name || "User",
                    role: user.role || "user",
                    oldCct: user.cctBalance,
                    moveAmount: amountToMove,
                    newCct: 0, // Pura move ho raha hai toh CCT zero ho jayega
                    oldWallet: user.walletBalance || 0,
                    newWallet: (user.walletBalance || 0) + amountToMove
                });
                totalCctToMove += amountToMove;
            }
        }

        if (pendingTransfers.length === 0) {
            console.log("🎉 Koi bhi aisa user nahi mila jisne stake NAHI kiya ho aur jiske paas CCT ho. Sab clear hai!");
            process.exit(0);
        }

        // 🛑 STEP 2: DETAILS DIKHAO (Table Format)
        console.log(`\n========================================================================================`);
        console.log(`📊 NON-STAKERS CCT MIGRATION DETAILED REPORT`);
        console.log(`========================================================================================`);
        
        const tableData = pendingTransfers.map(t => ({
            "ID": t.userId,
            "Role": t.role,
            "Current CCT": t.oldCct.toFixed(2),
            "Moving to Wallet": `-> ${t.moveAmount.toFixed(2)}`,
            "Remaining CCT": t.newCct.toFixed(2), // Zero dikhega
            "Old Wallet": t.oldWallet.toFixed(2),
            "NEW Wallet": t.newWallet.toFixed(2)
        }));
        console.table(tableData);

        console.log(`========================================================================================`);
        console.log(`✅ Total Users Affected : ${pendingTransfers.length}`);
        console.log(`💰 Total CCT Moving     : $${totalCctToMove.toFixed(2)}`);
        
        // 🔥 BACKUP SAVE KARO (Jisse galti hone par undo kar sako)
        fs.writeFileSync('non_staker_migration_backup.json', JSON.stringify(pendingTransfers, null, 2));
        console.log(`💾 Backup file 'non_staker_migration_backup.json' saved!\n`);

        // 🔥 STEP 3: YES/NO CONFIRMATION
        const answer = await askQuestion(`⚠️ Upar table me data check kar lo. Sab theek lag raha hai? Do you want to proceed? (Type 'yes' or 'no'): `);

        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            console.log("\n🚀 Executing Migration...\n");

            let processedCount = 0;
            for (let transfer of pendingTransfers) {
                const userDoc = await User.findOne({ userId: transfer.userId });

                // Update balances
                userDoc.cctBalance -= transfer.moveAmount;
                userDoc.walletBalance = (userDoc.walletBalance || 0) + transfer.moveAmount;
                await userDoc.save();

                // Transaction history record create karo
                await Transaction.create({
                    userId: userDoc.userId,
                    type: "credit", 
                    source: "system",
                    amount: transfer.moveAmount,
                    description: `Admin Migration: Moved ${transfer.moveAmount} CCT to Wallet Balance (Non-Staker Rule).`,
                    status: 'success',
                    date: new Date()
                });

                processedCount++;
            }
            console.log(`\n🎉 MIGRATION COMPLETED SUCCESSFULLY! (${processedCount} Users Updated)`);
        } else {
            console.log("\n❌ Migration ABORTED. Database me koi change nahi kiya gaya hai.");
        }

    } catch (err) {
        console.error('\n❌ Error:', err);
    } finally {
        console.log("🔌 Disconnecting...");
        await mongoose.disconnect();
        process.exit(0); 
    }
};

runMigration();