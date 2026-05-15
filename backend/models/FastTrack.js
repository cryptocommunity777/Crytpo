// C:\Users\HP\Desktop\Cryptocommunity\backend\models\FastTrack.js
const mongoose = require('mongoose');

const fastTrackSchema = new mongoose.Schema({
    sponsorId: { type: Number, required: true, index: true },
    directUserId: { type: Number, required: true },
    dailyAmount: { type: Number, default: 1 },
    daysPaid: { type: Number, default: 0 },
    maxDays: { type: Number, default: 10 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    
    // 🔥 NAYA: Taaki double payment na ho
    lastPaidDate: { type: Date, default: null }, 
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FastTrack', fastTrackSchema);