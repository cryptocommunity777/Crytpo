const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true },

    // 🔹 Transaction type (🔥 FIX: Removed strict enum so it accepts any new type easily)
    type: { 
      type: String, 
      required: true 
    },

    // 🔹 Transaction source (🔥 FIX: Removed enum to allow 'system', 'pool', 'direct' without errors)
    source: { 
      type: String, 
      default: null 
    },

    // 🔹 Amounts
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    grossAmount: { type: mongoose.Schema.Types.Decimal128, default: null },

    fromUserId: { type: Number, default: null },
    toUserId: { type: Number, default: null },

    package: { type: Number, default: null },

    // 🔹 Plan Name (🔥 FIX: Removed plan0-plan7 list, set default to new plan)
    plan: { 
      type: String, 
      default: "Global Auto-Pool" 
    },

    level: { type: Number, default: null },

    description: { type: String, default: "" },
    txHash: { type: String, default: null },
    adminNote: { type: String, default: null },

    // 🔹 Status (🔥 FIX: Removed enum to allow 'success', 'completed', 'pending' freely)
    status: { 
      type: String, 
      default: "completed" 
    },

    date: { type: Date, default: Date.now },

    fromAddress: { type: String },
    toAddress: { type: String },
    
    // 🔹 Reversal fields
    reversed: { type: Boolean, default: false },
    reversedAt: { type: Date, default: null },
    reversalReason: { type: String, default: "" },

    // 🔹 Linking related transactions
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Indexes for fast performance
transactionSchema.index({ userId: 1, type: 1, plan: 1, level: 1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ status: 1 });

// 🔹 Convert Decimal128 → Number (So frontend gets simple numbers)
transactionSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.amount) ret.amount = parseFloat(ret.amount.toString());
    if (ret.grossAmount) ret.grossAmount = parseFloat(ret.grossAmount.toString());
    return ret;
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);