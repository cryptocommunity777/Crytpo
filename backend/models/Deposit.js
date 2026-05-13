const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      index: true, // fast lookup by user
    },
    name: {
      type: String,
      default: "",
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128, // high precision for crypto/finance
      required: true,
      validate: {
        validator: (v) => v > 0,
        message: 'Amount must be greater than 0',
      },
    },
    // 🔥 NAYA: User ko jo HD address assign hua hai wo yahan save hoga
    depositAddress: {
      type: String,
      index: true,
    },
    // 🔥 NAYA: Frontend ko jo reference ID milti hai (e.g. DEP_123456_userId)
    refId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    // 🔥 NAYA: 15-minute countdown ke liye expiration time
    expiresAt: {
      type: Date, 
    },
    txnHash: {
      type: String, // store blockchain tx hash once received
      unique: true,
      sparse: true, // allows multiple nulls
      index: true,
    },
    method: {
      type: String, 
      default: "HD_Wallet_BEP20", // Default method update kar diya
    },
    status: {
      type: String,
      // Naye status add kiye hain: "received" aur "expired"
      enum: ["pending", "received", "approved", "rejected", "expired"],
      default: "pending", // ⚠️ SECURITY FIX: Default hamesha 'pending' hona chahiye
      index: true, 
    },
  
    currency: {
      type: String, 
      default: "USDT", // USD se USDT kar diya
    },
    adminNote: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for sorting by creation date
depositSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Deposit", depositSchema);