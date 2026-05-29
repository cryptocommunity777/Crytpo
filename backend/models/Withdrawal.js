const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  name: { type: String, default: "-" },

  // 🔥 UPDATE: Enum hata diya taaki dynamic sources (pool_1, pool_2) save ho sakein
  source: {
    type: String,
    required: true
  },

  // ✅ NAYA FIELD: 12-Level Pool Plan ke liye
  poolLevel: { 
    type: Number, 
    default: 0 
  },

  grossAmount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },

  walletUsed: { type: Number, default: 0 },
  incomeUsed: { type: Number, default: 0 },

  walletAddress: { type: String, default: "" },
  txnHash: { type: String, default: "" },

  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "processing"],
    default: "pending" 
  },

  remarks: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

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