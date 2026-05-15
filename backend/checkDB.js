// backend/checkDB.js
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptocommunity");
        console.log("🔍 Checking Transactions for Fast Track...\n");
        
        // 🔥 .lean() lagaya hai taaki Mongoose ka koi filter na chale, exact DB wala data mile
        const txs = await Transaction.find({ type: 'fast_track' })
                                     .sort({ createdAt: -1 })
                                     .limit(3) // Sirf top 3 check karenge detail mein
                                     .lean();
        
        if (txs.length === 0) {
            console.log("❌ DB mein ek bhi 'fast_track' entry nahi mili!");
        } else {
            console.log(`✅ Found ${txs.length} 'fast_track' entries! Here is the exact DB format:\n`);
            
            txs.forEach((t, i) => {
                console.log(`============== ENTRY ${i + 1} ==============`);
                // Ye poora object as-it-is print karega
                console.dir(t, { depth: null, colors: true }); 
                
                console.log(`\n🕵️‍♂️ QUICK TYPE CHECK:`);
                console.log(`-> userId: ${t.userId} (Type: ${typeof t.userId})`);
                console.log(`-> fromUserId: ${t.fromUserId} (Type: ${typeof t.fromUserId})`);
                console.log(`-> amount format: ${typeof t.amount}`);
                console.log(`==========================================\n`);
            });
        }
    } catch (err) {
        console.log("❌ Error during check:", err);
    } finally {
        process.exit();
    }
}
check();