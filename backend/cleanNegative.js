const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Aapke Transaction model ka path check kar lena
const Transaction = require('./models/Transaction'); 

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/your_database_name"; 

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function cleanNegativeTransactions() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`\n==========================================`);
        console.log(`🚨 NEGATIVE TRANSACTION CLEANUP 🚨`);
        console.log(`==========================================\n`);

        // 🔥 Filter: Aisi transactions jinka amount 0 se kam hai
        const queryFilter = { amount: { $lt: 0 } };
        
        const badTransactions = await Transaction.find(queryFilter).limit(20); // Pehle 20 dikhayenge
        const totalCount = await Transaction.countDocuments(queryFilter);

        if (totalCount === 0) {
            console.log("✅ Sab badhiya hai! Koi bhi negative transaction nahi mili.");
            process.exit(0);
        }

        console.log(`⚠️  FOUND: ${totalCount} Corrupted/Negative Transactions.`);
        console.log(`\n--- Sample (Pehli 20 entries) ---`);
        console.table(badTransactions.map(t => ({ 
            UserId: t.userId, 
            Amount: t.amount, 
            Date: t.date, 
            Description: t.description 
        })));

        console.log(`\n==========================================`);
        
        rl.question(`👉 Kya aap in ${totalCount} negative transactions ko DELETE karna chahte hain? (yes / no): `, async (answer) => {
            
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                console.log(`\n🗑️  DELETING... PLEASE WAIT...\n`);
                
                const result = await Transaction.deleteMany(queryFilter);
                
                console.log(`✅ SUCCESS: ${result.deletedCount} negative entries database se udd gayi hain.`);
            } else {
                console.log(`\n❌ Action Cancelled. Kuch bhi delete nahi hua.`);
            }

            rl.close();
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ ERROR:", error);
        process.exit(1);
    }
}

cleanNegativeTransactions();
