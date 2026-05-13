// models/BlockedDevice.js
const mongoose = require('mongoose');

const BlockedDeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    reason: { type: String, default: "Multiple fake IDs" },
    blockedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BlockedDevice', BlockedDeviceSchema);