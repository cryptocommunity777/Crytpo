require("dotenv").config();
const mongoose = require("mongoose");

// Models import
const User = require("./models/User");
const Transaction = require("./models/Transaction");
const TopUp = require("./models/TopUp");
const Withdrawal = require("./models/Withdrawal");

const resetPartialData = async () => {
  try {
    // 1. Database Connect
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB Connected...");
    }

    console.log("⏳ Resetting Users Balance & Topups (Keeping Withdrawals Safe)...");

    // 2. Users ka Data 0/Empty karna (Fresh Start)
    await User.updateMany({}, {
      $set: {
        // --- 1. Topup & Wallet Reset ---
        topUpAmount: 0,
        isToppedUp: false,
        topUpDate: null,
        topUps: [], 
        walletBalance: 0,

        // --- 2. Income Reset ---
        directIncome: 0,
        levelIncome: 0,
        binaryIncome: 0,
        spinIncome: 0,
        
        // --- 3. Plan/ROI Reset ---
        dailyROI: [],
        planIncome: { plan1: 0, plan2: 0, plan3: 0, plan4: 0, plan5: 0, plan6: 0, plan7: 0 },
        
        // --- 4. Business Stats Reset ---
        strongLegBusiness: 0,
        weakLegBusiness: 0,
        primaryStrongDirect: null,

        // ⚠️ NOTE: Hum User profile me 'totalWithdrawn' ko 0 kar rahe hain 
        // taaki Dashboard naya dikhe. Lekin actual history niche bacha li gayi hai.
        totalWithdrawn: 0, 
        hasWithdrawn100: false,
        // pendingWithdrawals ko hum nahi ched rahe taaki agar koi pending hai to wo dikhe
        // Agar pending bhi hatana hai to niche wali line uncomment karein:
        // pendingWithdrawals: {}, 
      }
    });

    console.log("✅ All Users Reset (Balance 0, Topup 0)");

    // 3. Transactions Delete karna (LEKIN Withdrawals ko bachana)
    console.log("⏳ Cleaning Transactions (Except Withdrawals)...");
    
    // Logic: Delete all transactions WHERE type is NOT EQUAL ($ne) to 'withdrawal'
    // Note: Apne Database me check karlena ki withdrawal ka type 'withdrawal' hi hai na (lowercase)
    await Transaction.deleteMany({ 
      type: { $ne: "withdrawal" } 
    });
    
    console.log("✅ Transactions Cleaned (Withdrawal Records Kept Safe)");

    // 4. TopUp History Delete
    try {
        await TopUp.deleteMany({});
        console.log("✅ TopUp Logs Deleted");
    } catch(e) {}

    // 5. ❌ Withdrawal Collection ko TOUCH NAHI KARENGE
    // await Withdrawal.deleteMany({});  <-- Ye line hata di hai
    console.log("🛡️ Withdrawal History Preserved (Not Deleted)");

    console.log("🎉 SYSTEM RESET SUCCESSFUL (Withdrawals Saved)!");
    process.exit();

  } catch (err) {
    console.error("❌ Error during reset:", err);
    process.exit(1);
  }
};

resetPartialData();