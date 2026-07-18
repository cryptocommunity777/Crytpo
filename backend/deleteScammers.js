require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function run() {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ Error: MONGO_URI missing in .env file.");
            process.exit(1);
        }
        
        console.log("⏳ Database se connect ho raha hai...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected!\n");

        const db = mongoose.connection.db;
        const txCollection = db.collection('transactions');
        const usersCollection = db.collection('users');

        console.log("🔍 Scanning Database... Check kar raha hoon aisi transactions jinke Users delete ho chuke hain...");

        // 1. Saare Zinda (Valid) Users ki ID nikal lo
        const allValidUsers = await usersCollection.distinct("userId");
        
        // 2. Aisi Transactions dhoondo jinka userId valid users ki list mein NAHI hai
        const orphanQuery = { userId: { $nin: allValidUsers } };
        const orphanCount = await txCollection.countDocuments(orphanQuery);

        if (orphanCount === 0) {
            console.log("\n✅ Ledger ekdum saaf hai! Koi bhi fake/orphaned transaction nahi mili.");
            mongoose.connection.close();
            process.exit(0);
        }

        // 🔥 CHALLENGE SCREEN 🔥
        console.log("\n==================================================");
        console.log(`🚨 FAKE TRANSACTIONS DETECTED 🚨`);
        console.log("==================================================");
        console.log(`⚠️ WARNING: Mujhe ${orphanCount} aisi transactions (Withdrawals, Topups, Deposits) mili hain jinke Users database mein ab NAHI hain!`);
        console.log("Agar aap inko delete karenge, toh Admin Panel ka total hisaab wapas theek ho jayega.\n");

        rl.question(`❓ Kya aap in ${orphanCount} FAKE transactions ko hamesha ke liye DELETE karna chahte hain? \n(Type exactly 'YES' to delete, or press Enter to cancel): `, async (answer) => {
            
            if (answer === 'YES') {
                console.log(`\n⏳ ${orphanCount} kachra transactions delete ho rahi hain...`);
                const result = await txCollection.deleteMany(orphanQuery);
                console.log(`✅ SUCCESS: ${result.deletedCount} fake transactions hamesha ke liye delete ho gayi hain! Aapka ledger ab 100% accurate hai.`);
            } else {
                console.log("\n❌ Cancelled. Kisi bhi transaction ko delete nahi kiya gaya.");
            }
            
            mongoose.connection.close();
            rl.close();
        });

    } catch (error) {
        console.error("❌ Error:", error);
        mongoose.connection.close();
        rl.close();
    }
}

run();