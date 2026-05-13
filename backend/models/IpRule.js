const mongoose = require('mongoose');

const ipRuleSchema = new mongoose.Schema({
    ipAddress: { type: String, required: true, unique: true },
    limit: { type: Number, default: 5 }, // Default 5 rahegi
    isBlocked: { type: Boolean, default: false } // Block karne ke liye
}, { timestamps: true });

module.exports = mongoose.model('IpRule', ipRuleSchema);