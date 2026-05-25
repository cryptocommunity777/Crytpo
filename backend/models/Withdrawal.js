const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  name: { type: String, default: "-" },

  source: {
    type: String,
    required: true,
    enum: [
      // 🔥 NAYE $30 PLAN KE INCOME SOURCES 🔥
      "direct",   // Direct Referral Income
      "level",    // Standard Team Level Income
      "pool",     // ✅ 12-Level Global Single Leg Community Income
      "reward",   // Team Reward Income
      "wallet",   // Agar Main Wallet se seedha total withdraw ho raha hai
      "mixed",    // Agar multiple incomes ek sath withdraw ho rahi hain
      
      // 🛑 PURAANE SOURCES (Agar database me purani withdrawals padi hain toh inko rehne do, warna delete kar do)
       ]
  },

  // ✅ NAYA FIELD: 12-Level Pool Plan ke liye (Taki pata rahe user ne kis level ka paisa nikala)
  poolLevel: { 
    type: Number, 
    default: 0 
  },

  grossAmount: { type: Number, required: true },
  fee: { type: Number, default: 0 },          // Admin charge / Deduction
  netAmount: { type: Number, default: 0 },    // User ko kitna milega

  walletUsed: { type: Number, default: 0 },
  incomeUsed: { type: Number, default: 0 },

  walletAddress: { type: String, default: "" }, // Crypto Wallet Address (TRC20/BEP20)
  txnHash: { type: String, default: "" },       // Blockchain Transaction Hash

  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "processing"],
    default: "pending" 
  },

  remarks: { type: String, default: "" },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // (Optional) Agar withdrawal installments mein dena hai
  schedule: [
    {
      day: String,
      date: String,
      percent: Number,
      grossAmount: { type: Number, default: 0 },
      fee: { type: Number, default: 0 },
      netAmount: { type: Number, default: 0 },
      walletUsed: { type: Number, default: 0 },
      incomeUsed: { type: Number, default: 0 },
      status: { type: String, default: "pending" },
      walletAddress: { type: String, default: "" }
    }
  ]
});

module.exports = mongoose.model("Withdrawal", withdrawalSchema);