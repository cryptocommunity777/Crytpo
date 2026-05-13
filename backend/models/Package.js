// models/Package.js
const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },

  // Transaction limits (will be auto-filled based on price)
  minWithdraw: { type: Number, default: 20 }, // default minimum withdrawal
  maxWithdraw: { type: Number, default: 100 }, // will scale based on price
  minCredit: { type: Number, default: 10 },
  minTransfer: { type: Number, default: 10 },
}, { timestamps: true });

// Auto-fill limits whenever package is created or price changes
packageSchema.pre("save", function (next) {
  try {
    const price = Number(this.price) || 0;

    // Fixed minimum withdrawal
    this.minWithdraw = 20;

    // Maximum withdrawal scales with price, at least 100
    this.maxWithdraw = Math.max(100, Math.round(price * 10));

    // Keep minCredit and minTransfer fixed (can adjust if needed)
    this.minCredit = 10;
    this.minTransfer = 10;

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Package", packageSchema);
