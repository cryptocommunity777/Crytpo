// C:\Users\HP\Desktop\Cryptocommunity\backend\models\FakeUser.js
const mongoose = require('mongoose');

const fakeUserSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    name: { type: String, required: true },
    country: { type: String, required: true },
    isToppedUp: { type: Boolean, default: true }, // ✅ Naya
    topUpAmount: { type: Number, default: 30 },   // ✅ Naya ($30 fix)
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FakeUser', fakeUserSchema);