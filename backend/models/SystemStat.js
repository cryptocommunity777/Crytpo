const mongoose = require('mongoose');

const systemStatSchema = new mongoose.Schema({
    globalFakeCount: { type: Number, default: 0 },
    
    // 🔥 Naya field Admin ke India Boost control ke liye
    extraIndiaDailyTarget: { type: Number, default: 0 } ,
    extraNigeriaDailyTarget: { type: Number, default: 0 },       // Ye add karna hai
extraSouthAfricaDailyTarget: { type: Number, default: 0 },
});

module.exports = mongoose.model('SystemStat', systemStatSchema);