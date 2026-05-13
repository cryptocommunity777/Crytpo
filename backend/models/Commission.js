const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  userId: Number,
  fromUserId: Number,
  level: Number,
  amount: Number,
  type: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Commission', commissionSchema);
