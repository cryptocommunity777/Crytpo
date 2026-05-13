const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  siteTitle: { type: String, default: 'My MLM Platform' },
  supportEmail: { type: String, default: 'admin@example.com' },
  maintenanceMode: { type: Boolean, default: false },
  allowWithdrawals: { type: Boolean, default: true },
  allowTopUps: { type: Boolean, default: true },
  allowWalletTransfer: { type: Boolean, default: true },
  allowRegistrations: { type: Boolean, default: true },
  allowLogin: { type: Boolean, default: true },
allowCreditToWallet: { type: Boolean, default: true },
   loginBannerMessage: { type: String, default: '' },
  registrationNote: { type: String, default: '' },
  maintenanceWhitelist: { type: [Number], default: [] },
  blockedCountries: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Setting', SettingSchema);
