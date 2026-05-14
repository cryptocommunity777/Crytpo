const mongoose = require('mongoose');

const systemStatSchema = new mongoose.Schema({
  globalFakeCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('SystemStat', systemStatSchema);