const mongoose = require('mongoose');

const DummyTransactionSchema = new mongoose.Schema({
  userId: { type: Number, required: true }, 
  generatedId: { type: Number, required: true }, 
  amount: { type: Number, required: true },
  type: { type: String, required: true }, // 🔥 Default hata diya, ab direct route se aayega (Topup ya Withdrawal)
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.DummyTransaction || mongoose.model('DummyTransaction', DummyTransactionSchema);