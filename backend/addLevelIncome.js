require('dotenv').config(); 
const mongoose = require('mongoose');

// ==========================================
// ⚙️ APNI DETAILS YAHAN DAALEIN
// ==========================================
const TARGET_USER_ID = 2906476; // Jis ID ka balance badhana hai
const AMOUNT_TO_ADD = 9000;      // Kitna amount badhana hai (e.g. $300)
// ==========================================

// Basic Schemas (Strict: false zaroori hai taaki flexibilty rahe)
const UserSchema = new mongoose.Schema({ userId: Number }, { strict: false });
const TransactionSchema = new mongoose.Schema({ userId: Number }, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function runScript() {
    try {
        console.log("⏳ Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected Successfully!\n");

        const user = await User.findOne({ userId: TARGET_USER_ID });
        
        if (!user) {
            console.log(`❌ User with ID ${TARGET_USER_ID} not found!`);
            return;
        }

        // 🔥 EXACT TOPUP ROUTE WALA LOGIC ($inc USE KARKE)
        const updateResult = await User.updateOne(
            { userId: TARGET_USER_ID },
            { 
                $inc: { 
                    levelIncome: AMOUNT_TO_ADD, 
                    totalLevelIncome: AMOUNT_TO_ADD 
                } 
            }
        );

        if (updateResult.modifiedCount > 0) {
            console.log(`✅ User ${TARGET_USER_ID} Wallet Updated Successfully using $inc!`);
        } else {
            console.log(`⚠️ Warning: User found but wallet didn't update. Check database.`);
        }

        // 📝 TRANSACTION HISTORY (Aapke backend pattern ke hisaab se)
        await Transaction.create({
            userId: TARGET_USER_ID,
            type: "level_income", // Aapke route mein yahi type hai
            source: "level",
            amount: AMOUNT_TO_ADD,
            fromUserId: 1111111, // Dummy fromUser taaki system ko lage kisi ne topup kiya
            description: `Level Income Recovery/Manual Credit of $${AMOUNT_TO_ADD}`,
            status: "success",
            date: new Date()
        });
        
        console.log(`✅ Transaction added for $${AMOUNT_TO_ADD}!\n`);

    } catch (error) {
        console.error("❌ Script Error:", error);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed. Done!");
    }
}

runScript();