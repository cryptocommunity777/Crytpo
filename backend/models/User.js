const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ==========================================
  // 🔹 IDENTITY
  // ==========================================
  userId: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  country: { type: String, required: true },

  // ==========================================
  // 🔹 AUTHENTICATION
  // ==========================================
  password: { type: String, required: true },
  transactionPassword: { type: String, required: true },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },

  // ==========================================
  // 🔹 REFERRAL & GLOBAL TEAM (NAYE PLAN KE LIYE)
  // ==========================================
  sponsorId: { type: Number, default: null },
  isSponsorDeactivated: { type: Boolean, default: false }, 
  directCount: { type: Number, default: 0 },       // Kitne direct lagaye hain
  globalTeamCount: { type: Number, default: 0 },   // Global downline kitni hai

  // 🔥 NAYA: DAILY CAPPING TRACKER (Ab limit yahan save hogi)
  todayGlobalTeamAdded: { type: Number, default: 0 },
  lastGlobalTeamAddDate: { type: String, default: "" }, // Format: YYYY-MM-DD

  // ==========================================
  // 🔹 SECURITY & TRACKING
  // ==========================================
  deviceId: { type: String, default: null },
  telegramId: { type: String, default: null },
  isTelegramJoined: { type: Boolean, default: false },
  ipAddress: { type: String }, 
  depositAddress: { type: String, unique: true, sparse: true },

  // ==========================================
  // 🔹 WALLET & TOP-UP (MAIN BALANCES)
  // ==========================================
  walletBalance: { type: Number, default: 0 }, // Main Top-up Wallet (Deposits & 50% split returns)
  isToppedUp: { type: Boolean, default: false },
  topUpAmount: { type: Number, default: 0 },
  topUpDate: { type: Date },

  // 📜 Top-up history 
  topUps: [
    {
      plan: { type: String, default: "Global Auto-Pool" },
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    }
  ],

  // ✅ PACKAGE SYSTEM (Agar alag se buy karte hain)
  packages: [
    {
      plan: { type: String, default: "Global Auto-Pool" },
      amount: { type: Number, required: true },
      startDate: { type: Date, default: Date.now },
      withdrawn: { type: Number, default: 0 } 
    }
  ],

  purchasedPackages: { type: [Number], default: [] },
  boosterRewardPaid: { type: Boolean, default: false },

  // ==========================================
  // 💰 ALL 5 INCOMES TRACKING (WITHDRAWABLE WALLETS) 🔥 4 se 5 kar diya
  // ==========================================
  directIncome: { type: Number, default: 0 },
  totalDirectIncome: { type: Number, default: 0 }, 
  
  levelIncome: { type: Number, default: 0 },
  totalLevelIncome: { type: Number, default: 0 },
  
  // 🔥 DAILY ROI WALLET: Auto-pool se jo daily aayega wo sidha isme jhudega
  poolIncome: { type: Number, default: 0 },       
  totalPoolIncome: { type: Number, default: 0 },  
  
  rewardIncome: { type: Number, default: 0 },     
  totalRewardIncome: { type: Number, default: 0 },
  
  // ⚡ NAYA: FAST TRACK INCOME TRACKER ADD KIYA
  fastTrackIncome: { type: Number, default: 0 },
  totalFastTrackIncome: { type: Number, default: 0 },

  // 🏆 NEW: Team Reward Claim Tracker (Target paisa dobara na mile)
  claimedRewards: { type: [Number], default: [] }, 

  // ==========================================
  // 🚀 ACTIVE POOLS TRACKER (DAILY CRON JOB KE LIYE)
  // ==========================================
  activePools: [{
      level: Number,
      dailyAmount: Number,
      totalDays: Number,
      daysPaid: { type: Number, default: 0 },
      lastPaidDate: { type: String, default: "" }, // Format: YYYY-MM-DD
      status: { type: String, default: "ACTIVE" },  // "ACTIVE" or "COMPLETED"
      withdrawnAmount: { type: Number, default: 0 } // 🔥 YAHI WO LINE HAI JO MISSING THI
  }],

  // ==========================================
  // 🔹 WITHDRAWAL TRACKING
  // ==========================================
  pendingWithdrawals: { type: Number, default: 0 }, // Kitna total pending hai
  totalWithdrawn: { type: Number, default: 0 },     // Total successful withdrawn
  
  // ==========================================
  // 🔐 WALLET SECURITY
  // ==========================================
  walletAddress: { type: String, default: '' },
  walletAddressChangeCount: { type: Number, default: 0 },
  walletAddressChangeWindowStart: { type: Date, default: null },
  walletAddressHistory: [
    {
      address: { type: String },
      changedAt: { type: Date },
    }
  ],

  // 🔥 Ye lines User schema mein hona zaroori hain
  editProfileOtp: { type: String },
  editProfileOtpExpiry: { type: Date },
  profileEditAccessExpiry: { type: Date },
  

  // ==========================================
  // 🔹 ROLE & STATUS
  // ==========================================
  role: { type: String, enum: ['user', 'admin', 'promo', 'leader'], default: 'user' },
  isBlocked: { type: Boolean, default: false },

}, { timestamps: true });

// 🚀 Indexes for fast performance
userSchema.index({ sponsorId: 1 });
userSchema.index({ ipAddress: 1 }); 
userSchema.index({ deviceId: 1 });  
userSchema.index({ createdAt: -1 }); 
userSchema.index({ "activePools.status": 1 }); // Cron job daily queries ko superfast banayega

module.exports = mongoose.model('User', userSchema);