const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
 const TopUp = require('../models/TopUp');
const Package = require('../models/Package');
const ethers = require("ethers"); // ✅ add this
const DummyUser = require("../models/DummyUser"); 
const DummyTransaction = require("../models/DummyTransaction"); 
 
 const authMiddleware = require("../middleware/authMiddleware"); // sets req.user
const checkFeature = require("../middleware/checkFeatureEnabled");
// Helper: Get Settings
const getSettings = async () => await Setting.findOne();
// 🔹 Get Wallet Balance
// ✅ Fetch wallet balance
// GET /api/wallet/:userId



router.get("/admin-address", (req, res) => {
  const address = process.env.PLATFORM_WALLET;
  res.json({ address });
});

 


 
 

 


// ==========================================
// ✅ HELPER: Get Lifetime Incomes (Har type ki total earning)
// ==========================================
 

// ==========================================
// ✅ HELPER: Get Lifetime Incomes (Har type ki total earning)
// ==========================================
const getLifetimeIncomes = async (userId) => {
  const numericId = Number(userId);

  // Fetch sum of all incomes from Transaction history (Added "reward_income")
  const txns = await Transaction.find({
    userId: numericId,
    type: { $in: ["direct_income", "level_income", "plan_income", "spin_income", "binary_income", "reward_income"] },
  });

  let direct = 0;
  let level  = 0;
  let plan   = 0;
  let spin   = 0;
  let binary = 0;
  let reward = 0; // Naya variable reward ke liye

  for (const t of txns) {
    const amt = t.amount ? parseFloat(t.amount.toString()) : 0;
    if (t.type === "direct_income")  direct += amt;
    if (t.type === "level_income")   level  += amt;
    if (t.type === "plan_income")    plan   += amt;
    if (t.type === "spin_income")    spin   += amt;
    if (t.type === "binary_income")  binary += amt;
    if (t.type === "reward_income")  reward += amt; // Reward amount jodo
  }

  return { direct, level, plan, spin, binary, reward };
};


const packageEarnings = {
    10: [2, 3, 5, 5, 5],
  30: [5, 10, 15, 15, 15],
  60: [10, 20, 30, 30, 30],
  120: [20, 40, 60, 60, 60],
  240: [40, 80, 120, 120, 120],
  480: [80, 160, 240, 240, 240],
  960: [160, 320, 480, 480, 480]
};

const unlockDays = [3, 13, 43, 73, 103];

// ✅ NEW FUNCTION
// ✅ UPDATED FUNCTION 1: calculatePackageEarnings
// 🔥 Aaj ki date set kar di (Cut-off date)
const RULE_CHANGE_DATE = new Date("2026-05-06T14:30:00+05:30").getTime();

// ✅ UPDATED FUNCTION 1: calculatePackageEarnings
const calculatePackageEarnings = (packages, planKey) => {
  const filtered = (packages || []).filter(p => p.plan === planKey);
  let total = 0;

  const package30 = (packages || []).find(p => p.amount === 30);

  filtered.forEach(pkg => {
    const earningsArray = packageEarnings[pkg.amount];
    if (!earningsArray) return;

    let effectiveStartDate = pkg.startDate; // Default: Original Date

    if (pkg.amount === 10) {
      if (!package30) {
        // Agar 30 nahi liya toh income 0 (Timer ruka hua hai)
        return; 
      } else {
        // Agar 30 liya hai, toh check karo kab liya?
        const pkg30Time = new Date(package30.startDate).getTime();
        if (pkg30Time >= RULE_CHANGE_DATE) {
          // Naya user: Aaj ya aaj ke baad 30 liya hai, toh 30 ki date use hogi
          effectiveStartDate = package30.startDate;
        }
        // Purane users ke liye else ki zaroorat nahi, wo original date hi use karenge
      }
    }

    const diffDays = Math.floor((Date.now() - new Date(effectiveStartDate)) / (1000 * 60 * 60 * 24));

    if (diffDays >= unlockDays[0]) total += earningsArray[0];
    if (diffDays >= unlockDays[1]) total += earningsArray[1];
    if (diffDays >= unlockDays[2]) total += earningsArray[2];
    if (diffDays >= unlockDays[3]) total += earningsArray[3];
    if (diffDays >= unlockDays[4]) total += earningsArray[4];
  });

  return total;
};


// ✅ UPDATED FUNCTION 2: getLevelUnlockData
const getLevelUnlockData = (pkg, level, packages) => {
  let effectiveStartDate = pkg.startDate; 

  if (pkg.amount === 10) {
    const package30 = (packages || []).find(p => p.amount === 30);
    if (!package30) {
      return { isUnlocked: false, timeLeft: "Activate the $30 package to start your timer." };
    } else {
      const pkg30Time = new Date(package30.startDate).getTime();
      if (pkg30Time >= RULE_CHANGE_DATE) {
         // Naya user
         effectiveStartDate = package30.startDate;
      }
    }
  }

  const diffDays = Math.floor((Date.now() - new Date(effectiveStartDate)) / (1000 * 60 * 60 * 24));
  const requiredDays = unlockDays[level];

  if (requiredDays === undefined) {
    return { isUnlocked: false, timeLeft: "Invalid Level" };
  }

  const isUnlocked = diffDays >= requiredDays;
  let timeLeft = "";

  if (!isUnlocked) {
    const daysLeft = requiredDays - diffDays;
    timeLeft = `${daysLeft} days remaining`;
  }

  return { isUnlocked, timeLeft };
};
 
 
// 🧾 GET /wallet/deposit-history/:userId
router.get('/deposit-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const numericUserId = Number(userId);

    if (isNaN(numericUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const deposits = await Deposit.find({ userId: numericUserId }).sort({ createdAt: -1 });
    res.json(deposits); // ✅ Backend directly array return kar raha hai []
  } catch (err) {
    console.error('Error fetching deposit history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// 🔹 Wallet Transfer
const bcrypt = require('bcrypt');

 
 

// 🔹 Calculate total withdrawn from DB
async function getTotalWithdrawn(userId) {
  const result = await Withdrawal.aggregate([
    { $match: { userId, status: { $in: ["completed", "processed"] } } },
    { $group: { _id: null, total: { $sum: "$grossAmount" } } }
  ]);
  return result[0]?.total || 0;
}

 

// ======================================================
// 🚀 USDT BEP20 TRANSFER ROUTE (Strict Downline Only)
// ======================================================
// ======================================================
// 🚀 USDT BEP20 TRANSFER ROUTE (Strict Downline Only)
// ======================================================
router.post('/usdt-bep20-transfer', authMiddleware, async (req, res) => {
  try {
    // 🔥 FIX: Sender ki ID authMiddleware (req.user) se lenge
    const { toUserId, amount, transactionPassword } = req.body;
    const senderId = req.user.userId;

    // 🛑 Validation Checks
    if (!toUserId || !amount || !transactionPassword) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const [sender, receiver] = await Promise.all([
      User.findOne({ userId: Number(senderId) }),
      User.findOne({ userId: Number(toUserId) }),
    ]);

    if (!sender) return res.status(404).json({ message: 'Sender not found' });
    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

    // 🛑 SELF-TRANSFER BLOCK
    if (sender.userId === receiver.userId) {
        return res.status(400).json({ message: 'You cannot transfer funds to yourself.' });
    }

    const amt = Number(amount);
    
    // ✨ LIMIT CHECK: Minimum $10
    if (amt < 10) return res.status(400).json({ message: "Minimum transfer amount is $10" });

    // ✨ INTEGER CHECK: Koi decimal nahi
    if (amt % 1 !== 0) return res.status(400).json({ message: "Decimals not allowed. Please enter a whole number." });

    // 🔥 PROMO USER LOGIC 
    if (sender.role === "promo") {
        sender.usdtBep20Balance -= amt;
        receiver.usdtBep20Balance = (receiver.usdtBep20Balance || 0) + amt;
        await sender.save();
        await receiver.save();
        return res.json({ message: 'USDT BEP20 Transfer successful (Promo Mode)' });
    }

    // ============================================
    // 🛡️ STRICT RULES & CHECKS START
    // ============================================

    // 🛑 RULE 1: PASSWORD CHECK
    const isPasswordValid = (transactionPassword.toLowerCase() === sender.transactionPassword.toLowerCase());
    if (!isPasswordValid) {
      return res.status(403).json({ message: 'Invalid transaction password' });
    }

    // 🛑 RULE 2: USDT BEP20 BALANCE CHECK & LEADER RESERVE LOGIC 🔥
    const currentBalance = sender.usdtBep20Balance || 0;

    if (currentBalance < amt) {
      return res.status(400).json({ message: 'Insufficient USDT BEP20 balance' });
    }

    // NAYA LOGIC: Leader & Superleader ko transfer ke baad minimum $30 rakhna hoga
    if (sender.role === 'leader' ) {
        if ((currentBalance - amt) < 30) {
            const maxAllowed = Math.max(0, currentBalance - 30);
            return res.status(400).json({ 
                message: `Transfer Denied! you  must maintain a mandatory $30  in USDT BEP20 Wallet. You can transfer a maximum of $${maxAllowed}.` 
            });
        }
    }

    // 🛑 RULE 3: STRICT DOWNLINE CHECK
    let isDownline = false;
    let currentSponsorId = receiver.sponsorId;
    let depth = 0;
    const maxDepth = 1000; 

    while (currentSponsorId && depth < maxDepth) {
      if (Number(currentSponsorId) === Number(sender.userId)) {
        isDownline = true; 
        break;
      }
      
      const uplineUser = await User.findOne({ userId: Number(currentSponsorId) }).lean();
      if (!uplineUser) break; 
      
      currentSponsorId = uplineUser.sponsorId;
      depth++;
    }

    if (!isDownline) {
      return res.status(403).json({ message: 'Transfer restricted. You can only transfer USDT BEP20 to your direct or downline team members.' });
    }

    // ============================================
    // 💸 USDT BEP20 TRANSFER EXECUTION
    // ============================================
    sender.usdtBep20Balance -= amt;
    receiver.usdtBep20Balance = (receiver.usdtBep20Balance || 0) + amt;

    await sender.save();
    await receiver.save();

    const Transaction = require('../models/Transaction'); 
    
    // Sender Log
    await Transaction.create({
      userId: sender.userId,
      type: 'transfer', 
      source: 'usdt_bep20',
      fromUserId: sender.userId,
      toUserId: receiver.userId,
      amount: amt,
      grossAmount: amt,
      status: 'success',
      description: `Transferred $${amt} USDT BEP20 to Downline ID #${receiver.userId}`,
      date: new Date()
    });

    // Receiver Log 
    await Transaction.create({
      userId: receiver.userId,
      type: 'credit',
      source: 'usdt_bep20_transfer',
      fromUserId: sender.userId,
      toUserId: receiver.userId,
      amount: amt,
      grossAmount: amt,
      status: 'success',
      description: `Received $${amt} USDT BEP20 from Upline ID #${sender.userId}`,
      date: new Date()
    });

    res.json({ success: true, message: `Successfully transferred $${amt} USDT BEP20 to ${receiver.name}.` });

  } catch (err) {
    console.error("USDT BEP20 Transfer error:", err);
    res.status(500).json({ message: 'USDT BEP20 Transfer failed due to server error' });
  }
});


router.post('/transfer', async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, transactionPassword } = req.body;

    const settings = await getSettings();
    if (!settings?.allowWalletTransfer) {
      return res.status(403).json({ message: 'Transfers are currently disabled in the system' });
    }

    const [sender, receiver] = await Promise.all([
      User.findOne({ userId: Number(fromUserId) }),
      User.findOne({ userId: Number(toUserId) }),
    ]);

    if (!sender) return res.status(404).json({ message: 'Sender not found' });
    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

    const amt = Number(amount);
    
    // ✨ LIMIT CHANGED: Ab minimum $10 ka transfer ho sakta hai
    if (amt < 10) return res.status(400).json({ message: "Minimum transfer amount is $10" });

    // ✨ INTEGER CHECK: Koi decimal nahi chalega (Sirf round figures: 10, 11, 12, 13... allow hoga)
    if (amt % 1 !== 0) return res.status(400).json({ message: "Decimals not allowed. Please enter a whole number (e.g., 10, 11, 12)." });

    // 🔥 PROMO USER LOGIC START
    if (sender.role === "promo") {
      return res.json({ message: 'Transfer successful (Promo Mode)' });
    }
    // 🔥 PROMO USER LOGIC END

    // ============================================
    // 🛡️ NORMAL USER CHECKS START
    // ============================================

    // 1. Password Check (Capital/Small issue fixed)
    const isPasswordValid = (transactionPassword.toLowerCase() === sender.transactionPassword.toLowerCase());
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid transaction password' });
    }

    // 2. Balance Check
    if (sender.walletBalance < amt) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 3. ✨ STRICT DOWNLINE CHECK (Sirf Downline me transfer allow hoga)
    let isDownline = false;
    let currentSponsorId = receiver.sponsorId;
    let depth = 0;
    const maxDepth = 1000; // Infinite loop se bachne ke liye limit

    while (currentSponsorId && depth < maxDepth) {
      if (Number(currentSponsorId) === Number(sender.userId)) {
        isDownline = true; // Mil gaya! Sender iska upline hai (Yani Receiver downline me hai)
        break;
      }
      
      // Upar ki taraf search badhao
      const uplineUser = await User.findOne({ userId: Number(currentSponsorId) }).lean();
      if (!uplineUser) break; // Agar koi upline na mile to break
      
      currentSponsorId = uplineUser.sponsorId;
      depth++;
    }

    if (!isDownline) {
      return res.status(403).json({ message: 'Transfer restricted. You can only transfer funds to your downline members.' });
    }

    // ============================================
    // 💸 TRANSFER EXECUTION
    // ============================================
    sender.walletBalance -= amt;
    receiver.walletBalance += amt;

    await sender.save();
    await receiver.save();

    await Transaction.create({
      userId: sender.userId,
      type: 'transfer',
      fromUserId: sender.userId,
      toUserId: receiver.userId,
      amount: amt,
      grossAmount: amt,
      description: `Transfer from ${sender.userId} to ${receiver.userId}`,
    });

    res.json({ message: 'Transfer successful' });

  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ message: 'Transfer failed' });
  }
});


// ==========================================
// 🔥 PROMO USER TRANSFER API (Auto Generate ID & Name)
// ==========================================
router.post("/promo-transfer", authMiddleware, async (req, res) => {
  try {
    const { amount, transactionPassword } = req.body;

    const currentUser = await User.findOne({ userId: req.user.userId });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // 🛡️ Role Security Check
    if (currentUser.role !== "promo") {
      return res.status(403).json({ message: "Unauthorized: For promo users only." });
    }

    // 1. Password Check
    const isPasswordValid = (transactionPassword.toLowerCase() === currentUser.transactionPassword.toLowerCase());
    if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

    // 2. Amount Limits ($10 to $1000)
    const amt = Number(amount);
    if (amt < 10 || amt > 1000) {
      return res.status(400).json({ message: "Promo transfer amount must be between $10 and $1000." });
    }

    // ==========================================
    // 3. 🔥 90% ARRAY / 10% DATABASE LOGIC
    // ==========================================
    const indianNames = [
"Ruhan Abbasi", "Jagat Solanki", "Rajdeep Vanzara", "Hemant Chauda", "Pravin Dabhi",
    "Dharmesh Gohil", "Kalpesh Vadher", "Mahendra Chudasama", "Bharat Sarvaiya", "Kirit Khachar",
    "Nirav Barad", "Faizan Husaini", "Mikaeel Nizari", "Aqib Abbasi", "Shadman Faruqi",
    "Yahya Rizwan", "Sufyan Qadri", "Reyan Firdausi", "Arham Kashmiri", "Azaan Madani",
    "Huzaif Husaini", "Devjit Rongpi", "Bikram Terang", "Rupam Engti", "Pranjal Bey",
    "Madhab Daimary", "Rituram Basumatari", "Dipen Narzary", "Anup Teron", "Jitul Kemprai",
    "Bhaben Ronghang", "Moin Faruqi", "Naeem Abbasi", "Fardeen Nizari", "Talha Husaini",
    "Azeem Rizwan", "Sameeh Qadri", "Ariz Firdausi", "Noman Kashmiri", "Rafey Madani",
    "Ayaan Abbasi", "Shivendra Chaudhary", "Kundan Rajak", "Nawal Kishore", "Devesh Tanti",
    "Raghav Prasad", "Lalan Mandal", "Gautam Sinha", "Arun Chaurasia", "Bipin Sah",
    "Shashi Ranjan", "Ritesh Barnwal", "Madhav Rai", "Neeraj Keshri", "Ujjwal Bhagat",
    "Sudhanshu Kumar", "Pritam Das", "Dilip Mahto", "Vivekanand Pandit", "Anmol Raut",
    "Shivam Pasi", "Rajnish Goswami", "Chirag Teli", "Prakash Lohar", "Adarsh Kahar",
    "Hemant Nonia", "Sanjiv Beldar", "Anup Kanu", "Ravikant Sonar", "Ajeet Halwai",
    "Niranjan Baniya", "Mithun Koiri", "Rajan Mallah", "Rupesh Bind", "Satyendra Kevat",
    "Vikas Bharati", "Anil Tatwa", "Prashant Dom", "Manjeet Turha", "Sushil Hajam",
    "Dhananjay Kalwar", "Kartik Bhumihar", "Ashutosh Kamat", "Shubham Kaharwar", "Rohit Dhanuk",
    "Abhay Chero", "Nitesh Khatik", "Gaurav Bauri", "Mukul Pande", "Tej Narayan",
    "Harshvardhan Karna", "Lokesh Bisen", "Surendra Khawas", "Akhilesh Baitha", "Bhanu Rautia",
    "Vimal Godhi", "Pawan Kewat", "Chandan Kapar", "Rakesh Kurmi", "Aman Gaddi",
    "Dheeraj Thami", "Krishna Puri", "Ankit Nath", "Vivek Gorait", "Rajeev Kharwar",
    "Umesh Dangi", "Prem Rishi", "Mohan Bhar", "Kailash Giri", "Manoj Saday",
    "Shiv Kumar Mehto", "Rituraj Panika", "Nandan Aheer", "Saurabh Karmali", "Pradeep Bhuiyan",
    "Ravi Kharadi", "Yogesh Bhokta", "Ajay Bantar", "Deepak Mahuri", "Abhinav Basfor",
    "Vinod Pasiwan", "Pankaj Kharik", "Niraj Patwa", "Rajat Beldar", "Santosh Kori",
    "Shyam Dholi", "Pramod Chik", "Anurag Barhi", "Vikrant Rajwar", "Mukesh Banjara",
    "Sandeep Bhuihar", "Kundan Turi", "Harendra Khatikwar", "Shailesh Ghosh", "Amit Kewari",
    "Ranjan Paneri", "Brijesh Lohra", "Naveen Kharot", "Uday Bhaskar", "Rupak Dutta",
    "Mithilesh Dev", "Aravind Subramanian", "Harpreet Sandhu", "Vivek Tiwari", "Kishore Reddy",
    "Jignesh Patel", "Rakesh Mahato", "Karthikeyan Iyer", "Gurvinder Brar", "Anurag Shukla",
    "Srinivas Rao", "Dhaval Shah", "Prakash Munda", "Saravanan Krishnan", "Maninder Gill",
    "Amit Dwivedi", "Venkatesh Naidu", "Hardik Mehta", "Rajesh Soren", "Muthukumar Raman",
    ];

    let randomName = "";
    let randomFakeId = "";
    const chance = Math.random() * 100;

    if (chance <= 30) {
      // 90% CHANCE: Naya 7-digit ID
      randomName = indianNames[Math.floor(Math.random() * indianNames.length)];
      randomFakeId = Math.floor(1000000 + Math.random() * 9000000);
    } else {
      // 10% CHANCE: Purana FakeUser
      const FakeUser = require('../models/FakeUser'); // Path adjust kar lena agar alag folder me ho
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const fakeUsers = await FakeUser.aggregate([
        { $match: { date: { $lte: threeDaysAgo } } },
        { $sample: { size: 1 } }
      ]);

      if (fakeUsers && fakeUsers.length > 0) {
        randomName = fakeUsers[0].name;
        randomFakeId = fakeUsers[0].userId;
      } else {
        randomName = indianNames[Math.floor(Math.random() * indianNames.length)];
        randomFakeId = Math.floor(1000000 + Math.random() * 9000000);
      }
    }

    // ==========================================
    // 4. RECORD IN DUMMY TRANSACTION
    // ==========================================
    const DummyTransaction = require('../models/DummyTransaction'); 

    await DummyTransaction.create({
      userId: currentUser.userId,
      generatedId: randomFakeId, 
      amount: amt, 
      type: "transfer", 
      description: `Demo transfer of $${amt} sent to promo ID ${randomFakeId}`,
      date: new Date()
    });

    return res.json({ 
      success: true, 
      generatedId: randomFakeId, 
      name: randomName,
      message: `Promo transfer of $${amt} processed successfully.` 
    });

  } catch (err) {
    console.error("Promo Transfer Simulation Error:", err);
    res.status(500).json({ message: "Server processing error: " + err.message });
  }
});
// ==========================================
// 🚀 LEADER SPECIAL: TRANSFER ROUTE
// ==========================================
router.post(
  '/leader-transfer',
  authMiddleware,
  async (req, res) => {
    try {
      const { toUserId, amount, transactionPassword } = req.body;
      const fromUserId = req.user.userId;

      // Amount ko Number me convert kar lete hain taaki validation sahi se ho
      const transferAmount = Number(amount);

      // 🔥 1. MINIMUM $10 CHECK
      if (!toUserId || !transferAmount || transferAmount < 10) {
        return res.status(400).json({ message: " Minimum transfer amount is $10." });
      }

      // 🔥 2. INTEGER CHECK (10, 11, 12 allowed, 10.5 nahi)
      if (!Number.isInteger(transferAmount)) {
        return res.status(400).json({ message: "Transfer amount must be a whole number (e.g., 10, 11, 12). Decimals are not allowed." });
      }

      if (!transactionPassword) {
        return res.status(400).json({ message: "Transaction password is required." });
      }

      // 🔹 1. Leader (Sender) Check
      const sender = await User.findOne({ userId: fromUserId });
      if (!sender) return res.status(404).json({ message: "Sender not found." });

      if (sender.role !== 'leader') {
          return res.status(403).json({ message: "Access denied. Only leaders can use this route." });
      }

      const isValidPassword = (transactionPassword.toLowerCase() === sender.transactionPassword.toLowerCase());
      if (!isValidPassword) return res.status(403).json({ message: "Invalid transaction password." });

      if (String(fromUserId) === String(toUserId)) {
        return res.status(400).json({ message: "You cannot transfer funds to yourself." });
      }

      const receiver = await User.findOne({ userId: toUserId });
      if (!receiver) return res.status(404).json({ message: "Target user not found." });

      // =======================================================
      // 🔹 2. 🔥 DOWNLINE ONLY CHECK (No Upline / No Crossline)
      // =======================================================
      let isDownline = false;
      const isDirectReferral = Number(receiver.sponsorId) === Number(sender.userId);

      if (isDirectReferral) {
          isDownline = true;
      } else {
          // Upar ki taraf check karenge ki target user ke upline me sender aata hai ya nahi
          let checkUplineId = receiver.sponsorId;
          let depth = 1;
          // Maximum 50 levels tak check karega
          while (checkUplineId && depth <= 50) {
              if (Number(checkUplineId) === Number(sender.userId)) {
                  isDownline = true;
                  break;
              }
              const nextNode = await User.findOne({ userId: checkUplineId }).select('sponsorId');
              if (!nextNode) break;
              checkUplineId = nextNode.sponsorId;
              depth++;
          }
      }

      if (!isDownline) {
          return res.status(403).json({ 
              message: "Action Denied! You can only transfer funds to your own Downline. Upline or Crossline transfer is restricted." 
          });
      }

      // =======================================================
      // 🔹 3. 🔥 REAL BALANCE CHECK (Locked $30 Showcase Logic)
      // =======================================================
      // Leader ka total balance minus 30 = Usable Balance (Transfer ke liye 30 fix locked hai)
      const usableBalance = sender.walletBalance - 30;

      if (transferAmount > usableBalance) {
        return res.status(400).json({ 
          message: `Insufficient Earned Balance! You cannot transfer the $30 Leader Balance. You need more than $30 available to transfer.` 
        });
      }

      // 🔹 4. Deduct and Add
      sender.walletBalance -= transferAmount;
      receiver.walletBalance += transferAmount;

      await sender.save();
      await receiver.save();

      // 🔹 5. Create Transactions
      const Transaction = require('../models/Transaction');

      await Transaction.create({
        userId: sender.userId,
        type: "transfer",
        amount: transferAmount,
        fromUserId: sender.userId,
        toUserId: receiver.userId,
        description: `Fund Transferred to ${receiver.name} (${receiver.userId})`,
        status: "success",
        date: new Date()
      });

      await Transaction.create({
        userId: receiver.userId,
        type: "transfer",
        amount: transferAmount,
        fromUserId: sender.userId,
        toUserId: receiver.userId,
        description: `Fund Received from ${sender.name} (${sender.userId})`,
        status: "success",
        date: new Date()
      });

      res.status(200).json({
        success: true,
        message: `$${transferAmount} successfully transferred to ${receiver.userId}.`
      });

    } catch (error) {
      console.error("Leader Transfer Error:", error);
      res.status(500).json({ message: "Server error during leader transfer." });
    }
  }
);






// =====================================================================
// 🔥 ONE-TIME FIX API: Puraane users ke box balance theek karne ke liye
// =====================================================================
// router.get("/fix-old-users-pool", async (req, res) => {
//     try {
//         // Un sabhi users ko dhundho jinke paas kam se kam 1 pool active hai
//         const users = await User.find({ "activePools.0": { $exists: true } });
//         let fixedCount = 0;

//         for (let user of users) {
//             let totalGenerated = 0;
            
//             // 1. Calculate karo ki is user ne aaj tak pool se total kitna kamaya hai
//             user.activePools.forEach(p => {
//                 totalGenerated += (Number(p.daysPaid) || 0) * (Number(p.dailyAmount) || 0);
//             });

//             // 2. Check karo ki abhi uske paas kitna bacha hai, taaki pata chale usne nikala kitna tha
//             let currentPoolWallet = Number(user.poolIncome) || 0;
//             let alreadyWithdrawn = totalGenerated - currentPoolWallet;

//             // Agar usne kuch nikala tha (alreadyWithdrawn > 0), toh usko dabbon me set karo
//             if (alreadyWithdrawn > 0.01) {
                
//                 // Waterfall Method: Pehle Level 1 me dalo, bach jaye toh Level 2 me, and so on...
//                 for (let p of user.activePools) {
//                     let generatedForThisPool = (Number(p.daysPaid) || 0) * (Number(p.dailyAmount) || 0);
                    
//                     if (alreadyWithdrawn > 0.01) {
//                         let deductHere = Math.min(alreadyWithdrawn, generatedForThisPool);
//                         p.withdrawnAmount = deductHere; // Box me withdrawn amount save kar diya
//                         alreadyWithdrawn -= deductHere;
//                     } else {
//                         // Agar nikalne ka amount khatam ho gaya, toh aage ke boxes 0 rahenge
//                         if (!p.withdrawnAmount) p.withdrawnAmount = 0; 
//                     }
//                 }
                
//                 // Mongoose ko batao ki array me changes huye hain aur save karo
//                 user.markModified('activePools');
//                 await user.save();
//                 fixedCount++;
//             }
//         }

//         res.json({ 
//             success: true, 
//             message: `Jadoo ho gaya bhai! Total ${fixedCount} puraane users ke dabbe (boxes) ekdum theek ho gaye hain. 🚀` 
//         });

//     } catch (error) {
//         console.error("Fix Users Error:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// });
  
// GLOBAL_POOLS array yahan rakhne ki ab zaroorat nahi hai kyunki cron job calculation kar raha hai.

// ==========================================
// 1. GET WITHDRAWABLE BALANCES API (UPDATED)
// ==========================================
// ==========================================
// 1. GET WITHDRAWABLE BALANCES API
// ==========================================
router.get("/withdrawable/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: Number(req.params.userId) });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔥 NAYA LOGIC: Ab koi loop nahi chalega, seedha user ke real wallet check honge!
    res.json({
      walletBalance: user.walletBalance || 0, // Main Top-up Wallet
      direct: user.directIncome || 0,         // Available Direct Income
      level: user.levelIncome || 0,           // Available Level Income
      reward: user.rewardIncome || 0,         // Available Reward Income
      pool: user.poolIncome || 0,             // Daily Cron job wala Auto-Pool wallet
      isUserToppedUp: user.isToppedUp
    });

  } catch (err) {
    console.error("Withdrawable Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ==========================================
// 2. WITHDRAW POST API (Silent 50-50 Split + 10% Fee + Exact Level Tracking)
// ==========================================
// ==========================================
// WITHDRAW POST API (Silent 50-50 Split + 10% Fee + Exact Level Tracking)
// ==========================================
// router.post("/withdraw", authMiddleware, async (req, res) => {
//   try {
//     const { items, transactionPassword } = req.body;

//     const user = await User.findOne({ userId: req.user.userId });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // 🛡️ BASIC CHECKS
//     if (!user.isToppedUp) return res.status(400).json({ message: "Active ID (Top-up) is required to withdraw." });
    
//     const isPasswordValid = (transactionPassword.toLowerCase() === user.transactionPassword.toLowerCase());
//     if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

//     if (!items || !Array.isArray(items) || items.length === 0) {
//         return res.status(400).json({ message: "No withdrawal items provided." });
//     }

//     // 💰 CALCULATE TOTAL AMOUNT 
//     let totalAmt = 0;
//     for (let item of items) {
//       const amt = Math.floor(parseFloat(item.amount));
//       if (amt <= 0) return res.status(400).json({ message: "Invalid amount detected." });
      
//       totalAmt += amt; 
//     }
    
//     // ✨ NAYA CHECK (Loop ke bahar, yani Total Amount par)
//     if (totalAmt % 10 !== 0) {
//         return res.status(400).json({ message: `Total withdrawal amount must be in multiples of $10. Your total is $${totalAmt}.` });
//     }
    
//     // ✨ UPDATE: Minimum total withdrawal amount is now $10
//     if (totalAmt < 10) {
//         return res.status(400).json({ message: "Minimum total withdrawal amount is $10." });
//     }

//     // =========================================================
//     // 🔥 STEP 1: PRE-CHECK LOGIC (GATEKEEPER - STRICT SECURITY)
//     // =========================================================
    
//     let simDirectWallet = user.directIncome || 0;
//     let simLevelWallet = user.levelIncome || 0;
//     let simRewardWallet = user.rewardIncome || 0;
//     let simPoolWallet = user.poolIncome || 0; 

//     for (let item of items) {
//       const amt = Math.floor(parseFloat(item.amount));

//       if (item.source === "direct") {
//         if (simDirectWallet < amt) return res.status(400).json({ message: "Insufficient Direct Income balance." });
//         simDirectWallet -= amt; 
//       } 
//       else if (item.source === "level") {
//         if (simLevelWallet < amt) return res.status(400).json({ message: "Insufficient Level Income balance." });
//         simLevelWallet -= amt;
//       }
//       else if (item.source === "reward") {
//         if (simRewardWallet < amt) return res.status(400).json({ message: "Insufficient Reward Income balance." });
//         simRewardWallet -= amt;
//       }
//       else if (item.source.startsWith("pool")) {
//         if (simPoolWallet < amt) return res.status(400).json({ message: "Insufficient Community balance." });
//         simPoolWallet -= amt; 
//       } 
//       else {
//         return res.status(400).json({ message: `Unknown source: ${item.source}` });
//       }
//     }

//     // =========================================================
//     // 🔥 STEP 2: REAL DEDUCTION & EXACT LEVEL TRACKING
//     // =========================================================
//     for (let item of items) {
//       const amt = Math.floor(parseFloat(item.amount));
//       let descriptionName = item.source.toUpperCase();
//       let dbSource = item.source; 

//       // 1. Deduct full requested amount from User's specific income box
//       if (item.source === "direct") user.directIncome -= amt;
//       else if (item.source === "level") user.levelIncome -= amt;
//       else if (item.source === "reward") user.rewardIncome -= amt;
//       else if (item.source.startsWith("pool")) {
        
//         user.poolIncome -= amt; // Master wallet deduction

//         // 🔥 NAYA LOGIC: Specific Community Level Tracking
//         if (item.source.includes("_")) {
//             const levelNum = parseInt(item.source.split("_")[1]); // Extract '1' from 'pool_1'
//             descriptionName = `COMMUNITY LEVEL ${levelNum}`;      // History me saaf dikhega
            
//             // Database me us specific level ka withdrawn record save karna
//             if (user.activePools && user.activePools.length > 0) {
//                 const poolIndex = user.activePools.findIndex(p => p.level === levelNum);
//                 if (poolIndex !== -1) {
//                     // Update array value
//                     user.activePools[poolIndex].withdrawnAmount = (user.activePools[poolIndex].withdrawnAmount || 0) + amt;
                    
//                     // 🔥 YAHI WO JADOO KI LINE HAI JO PEHLE MISSING THI 🔥
//                     // Ye Mongoose ko batati hai ki array update hua hai, isko DB me save karo!
//                     user.markModified('activePools'); 
//                 }
//             }
//         } else {
//             descriptionName = "COMMUNITY POOL";
//         }
//       } 

//       // 💎 SILENT 50/50 SPLIT
//       const withdrawShare = amt * 0.50; // Aadha crypto withdrawal ke liye
//       const walletShare = amt * 0.50;   // Aadha re-topup wallet ke liye

//       // 🛑 10% FEE ON BOTH SHARES (Effective 45% / 45%)
//       const withdrawFee = withdrawShare * 0.10; 
//       const walletFee = walletShare * 0.10;     

//       const netWithdrawAmount = withdrawShare - withdrawFee; // User ke address pe jayega
//       const netWalletAmount = walletShare - walletFee;       // User ke CCT wallet me aayega

//       // 🔥 YAHAN CHANGE KIYA HAI: Top-up wallet (walletBalance) ki jagah CCT Wallet (cctBalance) me credit kar rahe hain
//       user.cctBalance = (user.cctBalance || 0) + netWalletAmount;
//       user.totalWithdrawn = (user.totalWithdrawn || 0) + amt; 

//       // Create Record for Crypto Withdrawal
//       await Withdrawal.create({
//         userId: user.userId,
//         source: dbSource, 
//         grossAmount: withdrawShare,
//         fee: withdrawFee, 
//         netAmount: netWithdrawAmount,
//         walletAddress: user.walletAddress || "Not Provided",
//         status: "pending",
//         date: new Date()
//       });

//       // 1. Withdrawal request log
//       await Transaction.create({
//         userId: user.userId,
//         type: "withdrawal",
//         source: dbSource,
//         amount: withdrawShare,
//         description: `Withdrawal from ${descriptionName}`, 
//         status: "pending"
//       });

//       // 2. Re-credit to wallet log (Description updated to say CCT Wallet)
//       await Transaction.create({
//         userId: user.userId,
//         type: "credit",
//         source: "system",
//         amount: netWalletAmount,
//         description: `CCT Wallet Credit from ${descriptionName} (after 10% fee)`, 
//         status: "success"
//       });
//     }

//     // Save Database
//     await user.save();

//     // Normal Success Message
//     return res.json({ 
//       success: true, 
//       message: "Withdrawal request submitted successfully. Half amount credited to CCT Wallet." 
//     });

//   } catch (err) {
//     console.error("Withdraw Error:", err);
//     res.status(500).json({ message: "Server processing error." });
//   }
// });

//  router.post("/withdraw", authMiddleware, async (req, res) => {
//   try {
//     const { items, transactionPassword } = req.body;

//     const user = await User.findOne({ userId: req.user.userId });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // 🛡️ BASIC CHECKS
//     if (!user.isToppedUp) return res.status(400).json({ message: "Active ID (Top-up) is required to withdraw." });
    
//     const isPasswordValid = (transactionPassword.toLowerCase() === user.transactionPassword.toLowerCase());
//     if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

//     if (!items || !Array.isArray(items) || items.length === 0) {
//         return res.status(400).json({ message: "No withdrawal items provided." });
//     }

//     // 💰 CALCULATE TOTAL AMOUNT 
//     let totalAmt = 0;
//     for (let item of items) {
//       const amt = Math.floor(parseFloat(item.amount));
//       if (amt <= 0) return res.status(400).json({ message: "Invalid amount detected." });
//       totalAmt += amt; 
//     }
    
//     if (totalAmt % 10 !== 0) {
//         return res.status(400).json({ message: `Total withdrawal amount must be in multiples of $10. Your total is $${totalAmt}.` });
//     }
    
//     if (totalAmt < 10) {
//         return res.status(400).json({ message: "Minimum total withdrawal amount is $10." });
//     }

//     // =========================================================
//     // 🔥 STEP 1: PRE-CHECK LOGIC (GATEKEEPER)
//     // =========================================================
//     let simDirectWallet = user.directIncome || 0;
//     let simLevelWallet = user.levelIncome || 0;
//     let simRewardWallet = user.rewardIncome || 0;
//     let simPoolWallet = user.poolIncome || 0; 

//     for (let item of items) {
//       const amt = Math.floor(parseFloat(item.amount));

//       if (item.source === "direct") {
//         if (simDirectWallet < amt) return res.status(400).json({ message: "Insufficient Direct Income balance." });
//         simDirectWallet -= amt; 
//       } 
//       else if (item.source === "level") {
//         if (simLevelWallet < amt) return res.status(400).json({ message: "Insufficient Level Income balance." });
//         simLevelWallet -= amt;
//       }
//       else if (item.source === "reward") {
//         if (simRewardWallet < amt) return res.status(400).json({ message: "Insufficient Reward Income balance." });
//         simRewardWallet -= amt;
//       }
//       else if (item.source.startsWith("pool")) {
//         if (simPoolWallet < amt) return res.status(400).json({ message: "Insufficient Community balance." });
//         simPoolWallet -= amt; 
//       } 
//     }

//     // =========================================================
//     // 🔥 STEP 2: REAL PAID DOWNLINE TEAM CALCULATION
//     // =========================================================
//     const allUsersForTeam = await User.find({}, 'userId sponsorId isToppedUp').lean();
//     const directMap = new Map();
//     for (let u of allUsersForTeam) {
//         if (u.sponsorId) {
//             if (!directMap.has(u.sponsorId)) directMap.set(u.sponsorId, []);
//             directMap.get(u.sponsorId).push(u);
//         }
//     }
    
//     let totalPaidTeam = 0;
//     let paidDirects = 0;
//     let queue = [...(directMap.get(user.userId) || [])];
    
//     // Pehle sirf Paid Directs count kar lo
//     for (let d of queue) {
//         if (d.isToppedUp) paidDirects++;
//     }

//     // Ab BFS se uske neeche ki poori team count karo (Level 2 se infinite tak)
//     while (queue.length > 0) {
//         const current = queue.shift();
//         if (current.isToppedUp) {
//             totalPaidTeam++; // Sirf paid (Topped Up) id count hogi
//         }
//         const children = directMap.get(current.userId) || [];
//         for (let child of children) {
//             queue.push(child);
//         }
//     }

//     // 🔥 MAIN LOGIC: Sirf Directs ke neeche wali paid team (Total - Directs)
//     const validTeamSize = Math.max(0, totalPaidTeam - paidDirects);

//     // 🚀 NEW CUMULATIVE BRACKET LOGIC AS PER YOUR CHART (0, +30, +50, +100...)
//     let communityWithdrawPercent = 0.20; 
//     if (validTeamSize >= 1980) communityWithdrawPercent = 1.00;      // 0+30+50+100+300+500+1000 = 1980 (100% USDT)
//     else if (validTeamSize >= 980) communityWithdrawPercent = 0.80;  // 0+30+50+100+300+500 = 980 (80% USDT)
//     else if (validTeamSize >= 480) communityWithdrawPercent = 0.60;  // 0+30+50+100+300 = 480 (60% USDT)
//     else if (validTeamSize >= 180) communityWithdrawPercent = 0.50;  // 0+30+50+100 = 180 (50% USDT)
//     else if (validTeamSize >= 80) communityWithdrawPercent = 0.40;   // 0+30+50 = 80 (40% USDT)
//     else if (validTeamSize >= 30) communityWithdrawPercent = 0.30;   // 0+30 = 30 (30% USDT)
//     // Agar < 30 hai toh default 20% rahega.

//     // =========================================================
//     // 🔥 STEP 3: REAL DEDUCTION & NO-FLUSH WALLET LOGIC
//     // =========================================================
    
//     let finalReport = {
//         totalRequested: 0,
//         totalFeeDeducted: 0,
//         totalNetUSDT: 0,
//         totalToTopupWallet: 0,
//         teamSizeTracked: validTeamSize, 
//         communityPercentage: communityWithdrawPercent * 100
//     };

//     for (let item of items) {
//       const amt = Math.floor(parseFloat(item.amount));
//       let descriptionName = item.source.toUpperCase();
//       let dbSource = item.source; 

//       // 1. Balance se kaato
//       if (item.source === "direct") user.directIncome -= amt;
//       else if (item.source === "level") user.levelIncome -= amt;
//       else if (item.source === "reward") user.rewardIncome -= amt;
//       else if (item.source.startsWith("pool")) {
//         user.poolIncome -= amt; 
//         if (item.source.includes("_")) {
//             const levelNum = parseInt(item.source.split("_")[1]); 
//             descriptionName = `COMMUNITY LEVEL ${levelNum}`;      
//             if (user.activePools && user.activePools.length > 0) {
//                 const poolIndex = user.activePools.findIndex(p => p.level === levelNum);
//                 if (poolIndex !== -1) {
//                     user.activePools[poolIndex].withdrawnAmount = (user.activePools[poolIndex].withdrawnAmount || 0) + amt;
//                     user.markModified('activePools'); 
//                 }
//             }
//         } else {
//             descriptionName = "COMMUNITY POOL";
//         }
//       } 

//       // 💎 MATH LOGIC: 10% Fee aur Split
//       const totalFee = amt * 0.10; // 10% System Fee
//       const netAmountAfterFee = amt - totalFee; // Fee katne ke baad bacha amount
      
//       let netUSDT = 0;
//       let netTopupWallet = 0;

//       if (item.source === "direct" || item.source === "level" || item.source === "reward") {
//           // DIRECT/LEVEL/REWARD: Team ki koi condition nahi. 50% USDT, 50% Top-up Wallet
//           netUSDT = netAmountAfterFee * 0.50; 
//           netTopupWallet = netAmountAfterFee * 0.50; 
//       } 
//       else if (item.source.startsWith("pool")) {
//           // COMMUNITY: Team Size ke hisaab se USDT, aur bacha hua poora Top-up Wallet mein jayega (No Flush)
//           netUSDT = netAmountAfterFee * communityWithdrawPercent;
//           netTopupWallet = netAmountAfterFee - netUSDT; 
//       }

//       // Add to user balances
//       user.walletBalance = (user.walletBalance || 0) + netTopupWallet; // 💰 Topup Wallet (walletBalance)
//       user.totalWithdrawn = (user.totalWithdrawn || 0) + netUSDT; 

//       // Update Frontend Report
//       finalReport.totalRequested += amt;
//       finalReport.totalFeeDeducted += totalFee;
//       finalReport.totalNetUSDT += netUSDT;
//       finalReport.totalToTopupWallet += netTopupWallet;

//       // Create Crypto Withdrawal Request
//       if (netUSDT > 0) {
//           await Withdrawal.create({
//             userId: user.userId,
//             source: dbSource, 
//             grossAmount: amt, 
//             fee: totalFee, 
//             netAmount: netUSDT,
//             walletAddress: user.walletAddress || "Not Provided",
//             status: "pending",
//             date: new Date()
//           });
//       }

//       // Logs creation
//       await Transaction.create({
//         userId: user.userId,
//         type: "withdrawal",
//         source: dbSource,
//         amount: amt,
//         description: `Requested $${amt} from ${descriptionName}`, 
//         status: "pending"
//       });

//       if (netTopupWallet > 0) {
//           await Transaction.create({
//             userId: user.userId,
//             type: "credit",
//             source: "system",
//             amount: netTopupWallet,
//             description: `Top-up Wallet Credit (${descriptionName} withdrawal share)`, 
//             status: "success"
//           });
//       }
//     }

//     await user.save();

//     return res.json({ 
//       success: true, 
//       message: "Withdrawal processed successfully.",
//       report: finalReport // Frontend popup ko details bhej rahe hain
//     });

//   } catch (err) {
//     console.error("Withdraw Error:", err);
//     res.status(500).json({ message: "Server processing error." });
//   }
// });


router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    // 🔥 NAYA: dryRun add kiya gaya hai body se
    const { items, transactionPassword, dryRun } = req.body;

    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🛡️ BASIC CHECKS
    if (!user.isToppedUp) return res.status(400).json({ message: "Active ID (Top-up) is required to withdraw." });
    
    const isPasswordValid = (transactionPassword.toLowerCase() === user.transactionPassword.toLowerCase());
    if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No withdrawal items provided." });
    }

    let totalAmt = 0;
    for (let item of items) {
      const amt = Math.floor(parseFloat(item.amount));
      if (amt <= 0) return res.status(400).json({ message: "Invalid amount detected." });
      totalAmt += amt; 
    }
    
    if (totalAmt % 10 !== 0) {
        return res.status(400).json({ message: `Total withdrawal amount must be in multiples of $10. Your total is $${totalAmt}.` });
    }
    if (totalAmt < 10) {
        return res.status(400).json({ message: "Minimum total withdrawal amount is $10." });
    }

    // =========================================================
    // 🔥 STEP 1: PRE-CHECK LOGIC (GATEKEEPER)
    // =========================================================
    let simDirectWallet = user.directIncome || 0;
    let simLevelWallet = user.levelIncome || 0;
    let simRewardWallet = user.rewardIncome || 0;
    let simPoolWallet = user.poolIncome || 0; 

    for (let item of items) {
      const amt = Math.floor(parseFloat(item.amount));
      if (item.source === "direct") {
        if (simDirectWallet < amt) return res.status(400).json({ message: "Insufficient Direct Income balance." });
        simDirectWallet -= amt; 
      } 
      else if (item.source === "level") {
        if (simLevelWallet < amt) return res.status(400).json({ message: "Insufficient Level Income balance." });
        simLevelWallet -= amt;
      }
      else if (item.source === "reward") {
        if (simRewardWallet < amt) return res.status(400).json({ message: "Insufficient Reward Income balance." });
        simRewardWallet -= amt;
      }
      else if (item.source.startsWith("pool")) {
        if (simPoolWallet < amt) return res.status(400).json({ message: "Insufficient Community balance." });
        simPoolWallet -= amt; 
      } 
    }

    // =========================================================
    // 🔥 STEP 2: REAL PAID DOWNLINE TEAM CALCULATION
    // =========================================================
    const allUsersForTeam = await User.find({}, 'userId sponsorId isToppedUp').lean();
    const directMap = new Map();
    for (let u of allUsersForTeam) {
        if (u.sponsorId) {
            if (!directMap.has(u.sponsorId)) directMap.set(u.sponsorId, []);
            directMap.get(u.sponsorId).push(u);
        }
    }
    
    let totalPaidTeam = 0;
    let paidDirects = 0;
    let queue = [...(directMap.get(user.userId) || [])];
    
    for (let d of queue) {
        if (d.isToppedUp) paidDirects++;
    }

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.isToppedUp) totalPaidTeam++; 
        const children = directMap.get(current.userId) || [];
        for (let child of children) queue.push(child);
    }

   // const validTeamSize = Math.max(0, totalPaidTeam - paidDirects);
let validTeamSize = Math.max(0, totalPaidTeam - paidDirects);

    if (user.userId === "1054948" || user.userId === 1054948) { 
        validTeamSize += 10000; // Jitni team extra dikhani hai (+2000 add kar diya)
        
        // Ya agar aap seedha fixed team dikhana chahte hain toh ye use karein:
        // validTeamSize = 2500; 
    }

    let communityWithdrawPercent = 0.20; 
    if (validTeamSize >= 1980) communityWithdrawPercent = 1.00;      
    else if (validTeamSize >= 980) communityWithdrawPercent = 0.80;  
    else if (validTeamSize >= 480) communityWithdrawPercent = 0.60;  
    else if (validTeamSize >= 180) communityWithdrawPercent = 0.50;  
    else if (validTeamSize >= 80) communityWithdrawPercent = 0.40;   
    else if (validTeamSize >= 30) communityWithdrawPercent = 0.30;   

    // =========================================================
    // 🔥 STEP 3: REAL DEDUCTION & WALLET LOGIC
    // =========================================================
    let finalReport = {
        totalRequested: 0,
        totalFeeDeducted: 0,
        totalNetUSDT: 0,
        totalToTopupWallet: 0,
        teamSizeTracked: validTeamSize, 
        communityPercentage: communityWithdrawPercent * 100
    };

    for (let item of items) {
      const amt = Math.floor(parseFloat(item.amount));
      let descriptionName = item.source.toUpperCase();
      let dbSource = item.source; 

      if (!dryRun) {
          if (item.source === "direct") user.directIncome -= amt;
          else if (item.source === "level") user.levelIncome -= amt;
          else if (item.source === "reward") user.rewardIncome -= amt;
          else if (item.source.startsWith("pool")) {
            user.poolIncome -= amt; 
            if (item.source.includes("_")) {
                const levelNum = parseInt(item.source.split("_")[1]); 
                descriptionName = `COMMUNITY LEVEL ${levelNum}`;      
                if (user.activePools && user.activePools.length > 0) {
                    const poolIndex = user.activePools.findIndex(p => p.level === levelNum);
                    if (poolIndex !== -1) {
                        user.activePools[poolIndex].withdrawnAmount = (user.activePools[poolIndex].withdrawnAmount || 0) + amt;
                        user.markModified('activePools'); 
                    }
                }
            } else {
                descriptionName = "COMMUNITY POOL";
            }
          } 
      }

      const totalFee = amt * 0.10; 
      const netAmountAfterFee = amt - totalFee; 
      
      let netUSDT = 0;
      let netTopupWallet = 0;

      if (item.source === "direct" || item.source === "level" || item.source === "reward") {
          netUSDT = netAmountAfterFee * 0.50; 
          netTopupWallet = netAmountAfterFee * 0.50; 
      } 
      else if (item.source.startsWith("pool")) {
          netUSDT = netAmountAfterFee * communityWithdrawPercent;
          netTopupWallet = netAmountAfterFee - netUSDT; 
      }

      finalReport.totalRequested += amt;
      finalReport.totalFeeDeducted += totalFee;
      finalReport.totalNetUSDT += netUSDT;
      finalReport.totalToTopupWallet += netTopupWallet;

      // 🔥 Sirf tab database mein logs aur save karo jab dryRun FALSE ho
      if (!dryRun) {
          user.walletBalance = (user.walletBalance || 0) + netTopupWallet; 
          user.totalWithdrawn = (user.totalWithdrawn || 0) + netUSDT; 

          if (netUSDT > 0) {
              await Withdrawal.create({
                userId: user.userId, source: dbSource, grossAmount: amt, 
                fee: totalFee, netAmount: netUSDT, walletAddress: user.walletAddress || "Not Provided",
                status: "pending", date: new Date()
              });
          }

          await Transaction.create({
            userId: user.userId, type: "withdrawal", source: dbSource,
            amount: amt, description: `Requested $${amt} from ${descriptionName}`, status: "pending"
          });

          if (netTopupWallet > 0) {
              await Transaction.create({
                userId: user.userId, type: "credit", source: "system",
                amount: netTopupWallet, description: `Top-up Wallet Credit (${descriptionName} withdrawal share)`, status: "success"
              });
          }
      }
    }

    // 🔥 Agar Dry Run tha, toh save mat karo, bas calculation return kardo
    if (dryRun) {
        return res.json({ success: true, message: "Pre-check calculated", report: finalReport });
    }

    await user.save();

    return res.json({ 
      success: true, message: "Withdrawal processed successfully.", report: finalReport 
    });

  } catch (err) {
    console.error("Withdraw Error:", err);
    res.status(500).json({ message: "Server processing error." });
  }
});


 

router.post("/promo-withdraw", authMiddleware, async (req, res) => {
  try {
    const { items, transactionPassword } = req.body;

    const currentUser = await User.findOne({ userId: req.user.userId });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // 🛡️ Role Security Check
    if (currentUser.role !== "promo") {
      return res.status(403).json({ message: "Unauthorized: For promo users only." });
    }

    // 1. Password Check
    const isPasswordValid = (transactionPassword.toLowerCase() === currentUser.transactionPassword.toLowerCase());
    if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

    // 💰 Calculation
    let totalAmt = 0;
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        totalAmt += Math.floor(parseFloat(item.amount) || 0);
      });
    }

    // 🔥 Minimum 10 and Multiples of 10 Check
    if (totalAmt < 10) {
      return res.status(400).json({ message: "Minimum withdrawal amount is $10." });
    }
    
    if (totalAmt % 10 !== 0) {
      return res.status(400).json({ message: "Withdrawal amount must be in multiples of $10 (e.g., 10, 20, 30...)." });
    }

    // ==========================================
    // 2. 🔥 90% ARRAY / 10% DATABASE LOGIC
    // ==========================================
    const indianNames = [
      "Aarav Patil", "Rohan Sharma", "Aditya Singh", "Rahul Verma", "Vikas Yadav", "Amit Kumar", "Ankit Gupta",
      "Sandeep Mishra", "Vivek Tiwari", "Rajesh Patel", "Mohit Sharma", "Ravi Yadav", "Akash Singh", "Deepak Verma",
      "Pankaj Kumar", "Nitin Sharma", "Karan Malhotra", "Saurabh Gupta", "Abhishek Jain", "Manish Patel", "Harsh Mehta",
      "Yash Shah", "Dhruv Patel", "Jay Mehta", "Meet Shah", "Kunal Joshi", "Rakesh Solanki", "Pravin Chauhan",
      "Vimal Desai", "Chirag Modi", "Hardik Patel", "Nilesh Gandhi", "Vijay Parmar", "Sanjay Bhatt", "Rohit Trivedi",
      "Gautam Shah", "Aman Joshi", "Vikas Mehra", "Anurag Singh", "Shubham Yadav", "Ayush Pandey", "Kartik Sharma",
      "Prashant Tiwari", "Ritesh Verma", "Sachin Mishra", "Vinay Kumar", "Akhil Gupta", "Rajat Singh", "Harshit Jain",
      "Sumit Patel", "Arjun Kapoor", "Kabir Khanna", "Vivaan Arora", "Ishaan Malhotra", "Reyansh Sethi", "Ayaan Batra",
      "Dev Sharma", "Aryan Gupta", "Krish Verma", "Laksh Yadav", "Priya Sharma", "Pooja Patel", "Sneha Verma",
      "Neha Gupta", "Riya Singh", "Anjali Yadav", "Kavita Mishra", "Simran Kaur", "Komal Sharma", "Aarti Patel",
      "Megha Verma", "Swati Gupta", "Ritu Singh", "Nisha Sharma", "Divya Patel", "Pallavi Verma", "Shreya Gupta",
      "Anita Singh", "Monika Yadav", "Jyoti Mishra", "Sonia Sharma", "Rashmi Patel", "Preeti Verma", "Sakshi Gupta",
      "Tanya Singh", "Payal Sharma", "Madhuri Patel", "Nandini Verma", "Khushi Gupta", "Isha Singh", "Radhika Sharma",
      "Muskan Patel", "Ananya Verma", "Kiara Gupta", "Myra Singh", "Meher Sharma", "Siya Patel", "Aarohi Verma",
      "Aakash Rao", "Ramesh Gowda", "Suresh Naidu", "Vinod Reddy", "Prakash Rao", "Mahesh Gowda", "Harsha Naik",
      "Lokesh Shetty", "Ganesh Hegde", "Kiran Acharya", "Darshan Rao", "Naveen Gowda", "Tejas Shetty", "Raghav Rao",
      "Anand Murthy", "Pradeep Hegde", "Manjunath Naik", "Srinivas Rao", "Venkatesh Gowda", "Ashwin Shetty",
      "Arvind Menon", "Rahul Nair", "Joseph Mathew", "Bibin George", "Vishnu Pillai", "Akhil Kurup", "Nikhil Menon",
      "Sandeep Nair", "Manu Varghese", "Rakesh Panicker", "Karthik Iyer", "Arjun Subramanian", "Hari Krishnan",
      "Pravin Natarajan", "Ashwin Balaji", "Raghav Raman", "Vivek Chandran", "Naveen Iyer", "Gokul Swamy",
      "Dinesh Pillai", "Sai Reddy", "Praneeth Goud", "Venkatesh Naidu", "Harsha Varma", "Ajay Chowdary", "Ram Charan",
      "Surya Teja", "Nani Krishna", "Bharat Rao", "Kiran Reddy", "Gurpreet Singh", "Harpreet Kaur", "Jaspreet Singh",
      "Maninder Gill", "Hardeep Sandhu", "Kuldeep Brar", "Navjot Sidhu", "Paramveer Singh", "Rupinder Dhillon",
      "Amritpal Grewal", "Rajveer Rathore", "Vikram Sisodia", "Pratap Chauhan", "Gajendra Shekhawat", "Ajit Rajawat",
      "Lokesh Bhati", "Sohan Parihar", "Mahendra Solanki", "Bhawani Jhala", "Dinesh Tanwar", "Amit Dahiya",
      "Rohit Hooda", "Vikas Malik", "Naveen Jakhar", "Deepak Sangwan", "Ajay Kadian", "Karan Punia", "Mukesh Deswal",
      "Yogesh Phogat", "Parveen Mor", "Ankit Yadav", "Shivam Mishra", "Ayush Pandey", "Vivek Dubey", "Rahul Tripathi",
      "Mohit Srivastava", "Abhishek Shukla", "Aman Bajpai", "Kunal Pathak", "Deepak Awasthi", "Nitish Kumar",
      "Chandan Jha", "Pankaj Thakur", "Mukesh Sinha", "Saurabh Rai", "Gautam Anand", "Manish Ojha", "Rahul Narayan",
      "Sunil Paswan", "Abhay Mandal", "Soumik Banerjee", "Arijit Chatterjee", "Sayan Ghosh", "Debashish Bose",
      "Subrata Das", "Prasenjit Roy", "Tapas Sen", "Kaushik Mitra", "Anirban Dutta", "Souvik Pal", "Satyajit Nayak",
      "Debasis Sahoo", "Prakash Mohanty", "Manas Panda", "Santosh Rout", "Rajesh Pati", "Bikash Swain", "Chandan Jena",
      "Rakesh Behera", "Dillip Samal", "Ritam Bora", "Anup Deka", "Pranab Saikia", "Nayan Gogoi", "Dipak Kalita",
      "Rahul Baruah", "Kaushik Talukdar", "Manas Bhuyan", "Bikram Phukan", "Ajit Bordoloi", "Ravi Soren", "Ajay Murmu",
      "Deepak Hembrom", "Vikash Tudu", "Rajesh Kisku", "Pankaj Marandi", "Nitesh Minz", "Santosh Besra", "Akash Purty",
      "Rohit Mahli", "Mohit Rawat", "Rahul Negi", "Deepak Bisht", "Ankit Nautiyal", "Saurabh Gusain", "Lokesh Kunwar",
      "Pankaj Bhandari", "Ashish Uniyal", "Akash Dhami", "Nitin Bartwal", "Aamir Khan", "Bilal Mir", "Tariq Lone",
      "Adil Bhat", "Sameer Zargar", "Junaid Sofi", "Imran Parray", "Faisal Butt", "Arif Andrabi", "Yasin Malik",
      "Kevin Dsouza", "Ryan Fernandes", "Jason Pinto", "Allan Mascarenhas", "Trevor Almeida", "Aaron Menezes",
      "Joel Sequeira", "Edwin Rebello", "Rohan Correia", "Clive Noronha", "Aryan Malhotra", "Kabir Khanna",
      "Vivaan Arora", "Ishaan Kapoor", "Reyansh Mehra", "Ayaan Sethi", "Dev Batra", "Aryan Oberoi", "Krish Talwar",
      "Laksh Juneja", "Priya Malhotra", "Simran Arora", "Riya Kapoor", "Ananya Khanna", "Kiara Batra", "Myra Talwar",
      "Siya Oberoi", "Meher Juneja", "Aarohi Sethi", "Shanaya Mehra", "Aarav Deshmukh"
    ];

    let randomName = "";
    let randomFakeId = "";

    // 🎲 0 se 100 ke beech ek random number
    const chance = Math.random() * 100;

    if (chance <= 90) {
      // 90% CHANCE: List se uthao aur naya ID banao
      randomName = indianNames[Math.floor(Math.random() * indianNames.length)];
      randomFakeId = Math.floor(1000000 + Math.random() * 9000000);
    } else {
      // 10% CHANCE: 3-din purana FakeUser Database se uthao
      const FakeUser = require('../models/FakeUser');
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const fakeUsers = await FakeUser.aggregate([
        { $match: { date: { $lte: threeDaysAgo } } },
        { $sample: { size: 1 } }
      ]);

      if (fakeUsers && fakeUsers.length > 0) {
        randomName = fakeUsers[0].name;
        randomFakeId = fakeUsers[0].userId;
      } else {
        // Fallback: Agar database khali hai ya purani ID nahi hai, toh List se utha lo
        randomName = indianNames[Math.floor(Math.random() * indianNames.length)];
        randomFakeId = Math.floor(1000000 + Math.random() * 9000000);
      }
    }

    // ==========================================
    // 3. RECORD IN DUMMY TRANSACTION (Topup & Withdrawal Both)
    // ==========================================
    const DummyTransaction = require('../models/DummyTransaction'); 

    // 🔥 MASTERSTROKE: Withdrawal se pehle ek "Fake Topup" ki entry daal do
    // Isko 1 se 5 din purana backdate kar dete hain taaki ekdum real lage
    const fakeJoinDate = new Date();
    fakeJoinDate.setDate(fakeJoinDate.getDate() - Math.floor(Math.random() * 5 + 1));

    // A. Pehle Fake Topup ki entry (Showcase/Backdated)
    await DummyTransaction.create({
      userId: currentUser.userId,
      generatedId: randomFakeId, 
      amount: 30, // Hamesha $30 dikhega Topup mein
      type: "topup", 
      description: `Node Activated with $30`,
      date: fakeJoinDate // Backdated time (1-5 din purana)
    });

    // B. Ab Fake Withdrawal ki entry (Jo aaj live feed me dikhegi)
    await DummyTransaction.create({
      userId: currentUser.userId,
      generatedId: randomFakeId, 
      amount: totalAmt, 
      type: "Withdrawal", 
      description: `Demo withdrawal of $${totalAmt} generated for promo ID ${randomFakeId}`,
      date: new Date() // Current time taaki live dashboard me upar aaye
    });

    return res.json({ 
      success: true, 
      generatedId: randomFakeId, 
      name: randomName,
      message: `Promo withdrawal of $${totalAmt} processed. (Hidden $30 Topup also generated!)` 
    });

  } catch (err) {
    console.error("Promo Withdraw Simulation Error:", err);
    res.status(500).json({ message: "Server processing error: " + err.message });
  }
});

// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\wallet.js

// ✅ Frontend calls: /api/wallet/history/${uid}
// Isliye route ka naam strictly '/history/:userId' hona chahiye
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // 1. 🔥 YAHAN UPDATE KIYA: "cct_transfer" add kar diya!
    const allowedTypes = [
      "deposit",
      "credit_to_wallet",
      "credit",        
      "transfer",
      "topup",         
      "debit_topup",
      "withdrawal",
      "manual_credit",
      "manual_debit",
      "fast_track",
      "convert_to_cct", 
      "cct_stake_send",  
      "cct_transfer"    // ✅ Ab CCT transfers bhi wallet history me dikhenge
    ];

    // 2. ✨ MEGA QUERY
    let txs = await Transaction.find({
      $and: [
        {
          $or: [
            { userId: userId },       
            { fromUserId: userId },   
            { toUserId: userId }      
          ]
        },
        { 
          type: { $in: allowedTypes } 
        },
        { 
          // PROMOTION wale fake transactions ko hide rakhega
          description: { $not: /PROMOTION/i } 
        }
      ]
    }).sort({ date: -1 }).lean();

    // 3. 🛡️ SAFETY FILTER: Fast track sirf Sponsor (paisa jisko mila) ko dikhe, downline ko nahi
    const cleanHistory = txs.filter(t => {
      if (t.type === 'fast_track') {
          return String(t.userId) === String(userId);
      }
      return true;
    });

    // Response ko 'history' key me bhejna hai
    res.json({ success: true, history: cleanHistory });

  } catch (err) {
    console.error("Wallet history error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// 🔥 GLOBAL POOL CONFIGURATION (Ye add karna zaroori tha)
const GLOBAL_POOLS = [
  { level: 1,  globalTeam: 20,    reqDirects: 1,  earning: 10   },
  { level: 2,  globalTeam: 40,    reqDirects: 2,  earning: 20   },
  { level: 3,  globalTeam: 100,   reqDirects: 3,  earning: 40   },
  { level: 4,  globalTeam: 200,   reqDirects: 4,  earning: 80   },
  { level: 5,  globalTeam: 400,   reqDirects: 5,  earning: 150  },
  { level: 6,  globalTeam: 1600,  reqDirects: 6,  earning: 200  },
  { level: 7,  globalTeam: 2000,  reqDirects: 8,  earning: 500  }, 
  { level: 8,  globalTeam: 3000,  reqDirects: 10, earning: 700  }, 
  { level: 9,  globalTeam: 4000,  reqDirects: 12, earning: 1000 }, 
  { level: 10, globalTeam: 5000,  reqDirects: 14, earning: 1500 }, 
  { level: 11, globalTeam: 7500,  reqDirects: 16, earning: 3000 }, 
  { level: 12, globalTeam: 10000, reqDirects: 18, earning: 5000 }  
];
 
// ---------------------------
// =========================================================
// 🔥 NEW: CREDIT TO WALLET ($30 PLAN WITH 4 INCOMES)
// =========================================================
router.post(
  "/credit-to-wallet",
  authMiddleware,
  async (req, res) => {
    try {
      const { items, transactionPassword, userId } = req.body;

      const user = await User.findOne({ userId: Number(userId) });
      if (!user) return res.status(404).json({ message: "User not found." });

      // 🛡️ BASIC CHECKS
      if (!user.isToppedUp) return res.status(400).json({ message: "You need an Active ID (Top-up required) to perform this action." });
      
      const isPasswordValid = (transactionPassword.toLowerCase() === user.transactionPassword.toLowerCase());
      if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Please enter an amount to credit." });
      }

      // 💰 CALCULATE TOTAL AMOUNT 
      let totalAmt = 0;
      for (let item of items) {
        const amt = Math.floor(parseFloat(item.amount));
        if (amt <= 0) return res.status(400).json({ message: "Invalid amount detected. Amount must be greater than 0." });
        totalAmt += amt;
      }

      if (totalAmt < 10) {
        return res.status(400).json({ 
            message: `Minimum required amount is $10. You only entered $${totalAmt}. Please increase the amount.` 
        });
      }

      if (totalAmt % 10 !== 0) {
          return res.status(400).json({ 
              message: `Amount must be in multiples of $10 (e.g., $10, $20, $30). You entered $${totalAmt}.` 
          });
      }

      // =========================================================
      // 🔥 STEP 1: PRE-CHECK LOGIC
      // =========================================================
      
      let simDirect = user.directIncome || 0;
      let simLevel  = user.levelIncome  || 0;
      let simReward = user.rewardIncome || 0;
      let simPool   = user.poolIncome   || 0; 

      for (let item of items) {
        const amt = Math.floor(parseFloat(item.amount));

        if (item.source === "direct") {
          if (simDirect < amt) return res.status(400).json({ message: "Insufficient Direct Income balance." });
          simDirect -= amt;
        } 
        else if (item.source === "level") {
          if (simLevel < amt) return res.status(400).json({ message: "Insufficient Level Income balance." });
          simLevel -= amt;
        } 
        else if (item.source === "reward") {
          if (simReward < amt) return res.status(400).json({ message: "Insufficient Team Reward Income balance." });
          simReward -= amt;
        } 
        else if (item.source === "pool" || item.source.startsWith("pool")) {
          if (simPool < amt) return res.status(400).json({ message: "Insufficient Community Income balance." });
          simPool -= amt;
        } 
        else {
          return res.status(400).json({ message: `Invalid source detected: ${item.source}` });
        }
      }

      // =========================================================
      // 🔥 STEP 2: REAL DEDUCTION & EXACT LEVEL TRACKING
      // =========================================================
      
      for (let item of items) {
        const amt = Math.floor(parseFloat(item.amount));
        
        if (item.source === "direct") {
          user.directIncome -= amt;
        }
        else if (item.source === "level") {
          user.levelIncome -= amt;
        }
        else if (item.source === "reward") {
          user.rewardIncome -= amt;
        }
        else if (item.source === "pool" || item.source.startsWith("pool")) {
          
          user.poolIncome -= amt; // Master wallet deduction

          // 🔥 SAME AS WITHDRAW ROUTE: Specific Community Level Tracking
          if (item.source.includes("_")) {
              const levelNum = parseInt(item.source.split("_")[1]); // Extract '1' from 'pool_1'
              
              if (user.activePools && user.activePools.length > 0) {
                  const poolIndex = user.activePools.findIndex(p => p.level === levelNum);
                  if (poolIndex !== -1) {
                      user.activePools[poolIndex].withdrawnAmount = 
                        (user.activePools[poolIndex].withdrawnAmount || 0) + amt;
                      
                      // 🔥 Mongoose ko array update batana zaroori hai
                      user.markModified('activePools'); 
                  }
              }
          }
        }
      }

      // =========================================================
      // 🔥 WALLET UPDATE & TRANSACTION LOGS
      // =========================================================
      const totalFee       = totalAmt * 0.10; 
      const totalNetAmount = totalAmt - totalFee; 

      user.walletBalance = (user.walletBalance || 0) + totalNetAmount;
      await user.save();

      // Transaction Logs — per item
      for (let item of items) {
        const grossItemAmt = Math.floor(parseFloat(item.amount));
        const itemFee      = grossItemAmt * 0.10;
        const netItemAmt   = grossItemAmt - itemFee;

        // Clean name for DB log
        let cleanSourceName = item.source;
        let descriptionName = item.source.toUpperCase();

        if (item.source.startsWith("pool")) {
          if (item.source.includes("_")) {
            const levelNum = parseInt(item.source.split("_")[1]);
            cleanSourceName = `pool_${levelNum}`;
            descriptionName = `COMMUNITY LEVEL ${levelNum}`;
          } else {
            cleanSourceName = "pool";
            descriptionName = "COMMUNITY POOL";
          }
        }

        await Transaction.create({
          userId: user.userId,
          type: "credit_to_wallet",
          source: cleanSourceName, 
          amount: netItemAmt,         
          grossAmount: grossItemAmt,  
          netAmount: netItemAmt,      
          fee: itemFee,                  
          walletBalance: user.walletBalance,
          description: `Credited $${netItemAmt} after 10% fee (${descriptionName})`,
          status: "success",
          date: new Date(),
        });
      }

      res.json({
        success: true,
        message: `Successfully credited $${totalNetAmount} after 10% deduction.`,
        walletBalance: user.walletBalance
      });

    } catch (err) {
      console.error("Credit-to-wallet error:", err);
      res.status(500).json({ message: "Server processing error. Please try again later." });
    }
  }
);

// ---------------------------
// INSTANT WITHDRAW ROUTE
// For direct, level, spin only with fee
// Atomic and race-condition safe
// ---------------------------
 





// 🔹 GET specific withdrawal history for a user
router.get('/withdrawals/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    // Withdrawal model se data fetch karega
    const withdrawals = await Withdrawal.find({ userId }).sort({ date: -1 });
    
    res.json({ success: true, withdrawals });
  } catch (err) {
    console.error("Withdrawal history error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 🔹 Get Transaction History
// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\wallet.js

// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\wallet.js

// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\wallet.js

// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\wallet.js

// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\wallet.js

// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\wallet.js

router.get('/history/:userId', async (req, res) => {
  try {
    const rawUserId = req.params.userId;
    const userIdNum = Number(rawUserId);

    // Agar ID galat hai, toh safe format mein khali array bhejo
    if (isNaN(userIdNum)) {
      return res.status(400).json({ success: false, history: [] });
    }

    console.log(`\n🔎 LEDGER REQUEST: User ${userIdNum}`);

    // 1. Database Query (.lean() ke sath fast data fetch karne ke liye)
    const allTxs = await Transaction.find({
      $or: [
        { userId: userIdNum },
        { toUserId: userIdNum },
        { fromUserId: userIdNum }
      ]
    }).sort({ date: -1, createdAt: -1 }).lean(); 

    // ✅ Allowed list (Isme fast_track shamil hai)
    const allowedTypes = [
      "deposit", "credit_to_wallet", "credit", "transfer", 
      "topup", "debit_topup", "withdrawal", "manual_credit", 
      "manual_debit", "fast_track"
    ];

    // 2. Filter & Clean Data (Sab kuch yahin saaf ho jayega)
    const cleanHistory = allTxs
      .filter(t => {
        if (!t || !t.type) return false;
        
        // Unwanted types hatao
        if (!allowedTypes.includes(t.type)) return false;

        // Auto-pool / Promotion ka kachra saaf karo
        const desc = (t.description || "").toLowerCase();
        if (desc.includes("auto-pool") || desc.includes("promotion")) return false;

        // 🔥 Fast Track sirf asli owner (Sponsor) ko dikhe
        if (t.type === 'fast_track') {
           return String(t.userId) === String(rawUserId);
        }

        return true;
      })
      .map(t => {
        // 💰 DECIMAL 128 FIX: Backend se hi amount ko Number bana kar bhejo
        // Isse frontend par kabhi Object wala ya .toFixed() error nahi aayega!
        let safeAmount = 0;
        let safeGross = 0;

        // Extract Amount
        if (t.amount && t.amount.$numberDecimal) safeAmount = parseFloat(t.amount.$numberDecimal);
        else safeAmount = parseFloat(t.amount) || 0;

        // Extract Gross Amount
        if (t.grossAmount && t.grossAmount.$numberDecimal) safeGross = parseFloat(t.grossAmount.$numberDecimal);
        else safeGross = parseFloat(t.grossAmount) || 0;

        return {
          ...t,
          amount: safeAmount,
          grossAmount: safeGross
        };
      });

    console.log(`✨ SENDING: ${cleanHistory.length} clean items to frontend\n`);
    
    // Hamesha { success: true, history: [...] } format me bhejein
    res.json({ success: true, history: cleanHistory });

  } catch (err) {
    console.error("Route Error:", err);
    // Crash hone par bhi array bhejo taaki frontend white screen na de
    res.status(500).json({ success: false, history: [] });
  }
});

  



// GET /api/wallet/topup-history/:userId
// GET /api/wallet/topup-history/:userId
router.get("/topup-history/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId); // ensure numeric

    // 🔥 SUPER SCANNER: Yeh har top-up transaction ko dhoondh nikalega
    const topups = await Transaction.find({ 
      $and: [
        // 1. User chahe sender ho, receiver ho ya main userId ho
        {
          $or: [
            { userId: userId },
            { fromUserId: userId },
            { toUserId: userId }
          ]
        },
        // 2. Transaction ka type "topup", "debit_topup", "activation" jaisa kuch bhi ho
        {
          $or: [
            { type: { $regex: /topup|activation/i } },
            { source: { $regex: /topup/i } }
          ]
        }
      ]
    }).sort({ createdAt: -1 }); // latest first

    res.json(topups); 
  } catch (err) {
    console.error("Top-up history error:", err);
    res.status(500).json({ message: "Failed to fetch top-up history" });
  }
});




// ==========================================
// ✅ UPDATED ROUTE: Get User Wallet & Income Stats
// (Isko file mein sabse NEECHE rakho)
// ==========================================
// ✅ FINAL ROUTE: Get User Wallet & Income Stats
// (Isko file mein sabse NEECHE rakho)
// ==========================================
// 🔥 1. Yahan 'authMiddleware' add kiya gaya hai
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const loggedInUserId = Number(req.user.userId); 

    // 🔥 SECURITY LOCK
    if (req.user.role !== 'admin' && userId !== loggedInUserId) {
      return res.status(403).json({ success: false, message: "Unauthorized access: You can only view your own profile." });
    }
    
    // 1. User validation 
    const user = await User.findOne({ userId }).select('-password -txnPassword -__v');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 🔥 FIX FOR OLD DATA: Reward Income update
    if (!user.totalRewardIncome && user.rewardIncome > 0) {
        user.totalRewardIncome = user.rewardIncome;
        await user.save(); 
    }

    // 2. Lifetime incomes nikalna 
    const life = await getLifetimeIncomes(userId);

    // 3. Current Plan Income calculation
    const planKeys = ["plan1", "plan2", "plan3", "plan4", "plan5", "plan6"];
    let currentTotalPlanIncome = 0;

    planKeys.forEach(key => {
      currentTotalPlanIncome += calculatePackageEarnings(user.packages, key);
    });

    // 4. Final Response 
    res.json({
      success: true,
      user: user, 
      walletBalance: user.walletBalance || 0,
      
      // ✅ DASHBOARD LIFETIME TOTALS (Inka data box me dikhta hai)
      income: {
         totalDirectIncome: life.direct || user.totalDirectIncome || user.directIncome || 0,
         totalLevelIncome:  life.level  || user.totalLevelIncome || user.levelIncome || 0,
         totalRewardIncome: life.reward || user.totalRewardIncome || user.rewardIncome || 0,
         totalSpinIncome:   life.spin   || user.totalSpinIncome || user.spinIncome || 0,
         totalFastTrackIncome: user.totalFastTrackIncome || user.fastTrackIncome || 0,
         planIncome: currentTotalPlanIncome || 0,
         
         // 🔥 NAYA: STAKING INCOMES YAHAN ADD KI HAIN 🔥
         cctStakingIncome: user.cctStakingIncome || 0,
         cctStakingDirectIncome: user.cctStakingDirectIncome || 0,
         cctStakingLevelIncome: user.cctStakingLevelIncome || 0
      },

      // ✅ CURRENT WITHDRAWABLE BALANCES
      directIncome: user.directIncome || 0,
      levelIncome:  user.levelIncome || 0,
      spinIncome:   user.spinIncome || 0,
      rewardIncome: user.rewardIncome || 0, 
      fastTrackIncome: user.fastTrackIncome || 0, 

      // Sabka total (Staking isme alag rakha hai dashboard design ke hisaab se)
      totalLifetimeIncome: (
        (life.direct || 0) + 
        (life.level || 0) + 
        (currentTotalPlanIncome || 0) + 
        (life.spin || 0) + 
        (life.reward || 0) + 
        (user.totalFastTrackIncome || 0)
      )
    });

  } catch (err) {
    console.error("Fetch Wallet Error:", err);
    res.status(500).json({ success: false, message: "Server error while fetching wallet" });
  }
});

module.exports = router;