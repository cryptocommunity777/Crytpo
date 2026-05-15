const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, index: true },

    type: { 
      type: String, 
      required: true,
      index: true 
    },

    source: { 
      type: String, 
      default: null 
    },

    // 💰 Amounts
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    grossAmount: { type: mongoose.Schema.Types.Decimal128, default: 0 },

    fromUserId: { type: Number, default: null, index: true },
    toUserId: { type: Number, default: null, index: true },

    package: { type: Number, default: null },

    plan: { 
      type: String, 
      default: "Global Auto-Pool" 
    },

    level: { type: Number, default: null },

    description: { type: String, default: "" },
    txHash: { type: String, default: null },
    adminNote: { type: String, default: null },

    status: { 
      type: String, 
      default: "completed",
      index: true 
    },

    date: { type: Date, default: Date.now, index: true },

    fromAddress: { type: String },
    toAddress: { type: String },
    
    reversed: { type: Boolean, default: false },
    reversedAt: { type: Date, default: null },
    reversalReason: { type: String, default: "" },

    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
  },
  { 
    timestamps: true,
    // 🔥 YE ZAROORI HAI: Taaki transforms har jagah chalein
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
  }
);

// ✅ Performance Indexes
transactionSchema.index({ userId: 1, date: -1 });

// 🔹 BULLETPROOF CONVERSION: Decimal128 → Number
// Isse frontend mein .toFixed(2) wala error hamesha ke liye khatam ho jayega
const transformAmount = (doc, ret) => {
  if (ret.amount) {
    ret.amount = parseFloat(ret.amount.toString()) || 0;
  }
  if (ret.grossAmount) {
    ret.grossAmount = parseFloat(ret.grossAmount.toString()) || 0;
  }
  return ret;
};

transactionSchema.set("toJSON", { transform: transformAmount });
transactionSchema.set("toObject", { transform: transformAmount });

module.exports = mongoose.model("Transaction", transactionSchema);