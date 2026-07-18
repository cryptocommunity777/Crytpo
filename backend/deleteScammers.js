require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Jis address ko delete karna hai
const TARGET_ADDRESS = "0x6943B1e4719c29C645cA04f75FffAd2dA3E7A028";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function run() {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ Error: MONGO_URI nahi mili .env file mein. Dhyan rahe ki aap backend folder mein hain aur wahan .env file maujood hai!");
            process.exit(1);
        }
        
        console.log("⏳ Database se connect ho raha hai...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected!\n");

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users'); 

        // Address ko match karne ke liye query (case-insensitive)
        const query = { walletAddress: { $regex: new RegExp(`^${TARGET_ADDRESS}$`, "i") } };
        const usersFound = await usersCollection.find(query).toArray();

        if (usersFound.length === 0) {
            console.log(`✅ Safe: Is address (${TARGET_ADDRESS}) wala koi user database mein nahi hai.`);
            process.exit(0);
        }

        // 🔥 CHALLENGE SCREEN 🔥
        console.log("==================================================");
        console.log(`🚨 SCAMMER DETECTION CHALLENGE 🚨`);
        console.log("==================================================");
        console.log(`⚠️ WARNING: Total ${usersFound.length} user(s) mile hain jinka yeh wallet address hai: ${TARGET_ADDRESS}\n`);
        
        console.log("👉 Users ki details jo delete hone wale hain:");
        usersFound.forEach((u, index) => {
            console.log(`   ${index + 1}. User ID: ${u.userId || u._id} | Name: ${u.name || 'N/A'} | Email: ${u.email || 'N/A'}`);
        });
        console.log("==================================================\n");

        rl.question(`❓ KYA AAP IN ${usersFound.length} USERS KO HAMESHA KE LIYE DELETE KARNA CHAHTE HAIN? \n(Type exactly 'YES' to delete, or press Enter to cancel): `, async (answer) => {
            
            if (answer === 'YES') {
                console.log(`\n⏳ Deleting ${usersFound.length} users...`);
                const result = await usersCollection.deleteMany(query);
                console.log(`✅ SUCCESS: ${result.deletedCount} users hamesha ke liye delete ho gaye hain!`);
            } else {
                console.log("\n❌ Cancelled. Kisi bhi user ko delete nahi kiya gaya. SAFE.");
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