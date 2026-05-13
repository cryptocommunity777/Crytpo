const mongoose = require('mongoose');

const topUpSchema = new mongoose.Schema({
  funderUserId: { type: Number, required: true },
  targetUserId: { type: Number, required: true },
  amount: { type: Number, required: true },
  plan: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('TopUp', topUpSchema);
