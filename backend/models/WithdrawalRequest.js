 const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
module.exports = WithdrawalRequest;
