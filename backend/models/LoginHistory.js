const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  name: { type: String },
  mobile: { type: String }, 
  ipAddress: { type: String }
}, { timestamps: true }); // 🔥 YE LINE DATE AUR TIME AUTO-SAVE KAREGI (createdAt)

module.exports = mongoose.model('LoginHistory', loginHistorySchema);