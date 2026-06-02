require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline'); 

const Withdrawal = require('./models/Withdrawal'); 
const Transaction = require('./models/Transaction'); 

const TARGET_USER_ID = 1054948; // 🔥 Aapki ID

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

const runFix = async () => {
    try {
        console.log("⏳ Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected!\n");

        // 1. Saari withdrawals nikal lo
        const withdrawals = await Withdrawal.find({ userId: TARGET_USER_ID }).sort({ _id: -1 });

        if (withdrawals.length === 0) {
            console.log(`❌ User ID ${TARGET_USER_ID} ki koi withdrawal nahi mili!`);
            process.exit(0);
        }

        // 🔥 SMART LOGIC: Group transactions that happened at the exact same time
        const groupedWithdrawals = [];
        let currentGroup = [];

        for (let w of withdrawals) {
            if (currentGroup.length === 0) {
                currentGroup.push(w);
            } else {
                const time1 = new Date(currentGroup[0].date || currentGroup[0].createdAt).getTime();
                const time2 = new Date(w.date || w.createdAt).getTime();
                
                // Agar 5 second ke andar hue hain, toh ek hi withdrawal ka hissa hain
                if (Math.abs(time1 - time2) <= 5000) {
                    currentGroup.push(w);
                } else {
                    groupedWithdrawals.push(currentGroup);
                    currentGroup = [w];
                }
            }
        }
        if (currentGroup.length > 0) groupedWithdrawals.push(currentGroup);

        // Sirf LATEST 10 Groups (Actual Withdrawals) lenge
        const targetGroups = groupedWithdrawals.slice(0, 10);

        console.log(`==================================================`);
        console.log(`🔍 TOTAL ${targetGroups.length} LATEST WITHDRAWAL BATCHES MIL GAYE`);
        console.log(`==================================================\n`);

        const answer = await askQuestion("👉 Kya aap in records ko group karke date fix karna chahte hain? (yes / no): ");

        if (answer.toLowerCase() !== 'yes') {
            console.log("\n❌ Action Cancelled.");
            rl.close();
            process.exit(0);
        }

        console.log("\n🚀 Dates theek karna shuru kar rahe hain...\n");

        let currentDate = new Date('2026-05-31T12:00:00Z'); // Parso se start

        for (let i = 0; i < targetGroups.length; i++) {
            const group = targetGroups[i];
            const newDateToSet = new Date(currentDate);
            
            let totalAmountInBatch = 0;

            // Ek group ke saare records ko ek hi Date do
            for (let w of group) {
                const originalDate = w.date || w.createdAt;
                const timeMin = new Date(originalDate.getTime() - 2000); 
                const timeMax = new Date(originalDate.getTime() + 2000); 
                
                totalAmountInBatch += (w.grossAmount || 0);

                await Withdrawal.collection.updateOne(
                    { _id: w._id },
                    { $set: { date: newDateToSet, createdAt: newDateToSet, updatedAt: newDateToSet } }
                );

                await Transaction.collection.updateMany(
                    { userId: TARGET_USER_ID, createdAt: { $gte: timeMin, $lte: timeMax } },
                    { $set: { date: newDateToSet, createdAt: newDateToSet, updatedAt: newDateToSet } }
                );
            }

            console.log(`✅ BATCH ${i + 1} UPDATED (Total Parts: ${group.length}, Batch Amount: $${totalAmountInBatch})`);
            console.log(`   🆕 Nayi Date Set: ${newDateToSet.toLocaleDateString('en-GB')} ${newDateToSet.toLocaleTimeString('en-US', {hour12: true})}`);
            console.log(`--------------------------------------------------`);

            // Agle batch (withdrawal) ke liye din kam karo
            currentDate.setDate(currentDate.getDate() - 1);
        }

        console.log("\n🎉 THEEK HO GAYA! Ab ek withdrawal ke parts ek hi din mein dikhenge, alag-alag nahi.");
        rl.close();
        process.exit(0);

    } catch (error) {
        console.error("❌ Error aagaya:", error);
        rl.close();
        process.exit(1);
    }
};

runFix();