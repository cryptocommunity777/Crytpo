const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: String,
    referralId: String,
    message: { type: String, required: true },
    walletAddress: String,
    optional: String,
    status: { type: String, default: "Pending" },
    adminDeleted: { type: Boolean, default: false }, // ✅ soft delete flag
  },
  { timestamps: true }
);

module.exports = mongoose.model("Support", supportSchema);
