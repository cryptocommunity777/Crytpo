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
    
    // 🔥 LIMIT CHANGED: Ab minimum $5 ka transfer ho sakta hai
    if (amt < 5) return res.status(400).json({ message: "Minimum transfer amount is $5" });

    if (amt % 1 !== 0) return res.status(400).json({ message: "Decimals not allowed. Please enter round figure." });

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

    // 🔥 DOWNLINE CHECK REMOVED: Ab kisi ko bhi (anywhere) transfer ho sakta hai!

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
// 🚀 LEADER SPECIAL: TRANSFER ROUTE
// ==========================================
router.post(
  '/leader-transfer',
  authMiddleware,
  async (req, res) => {
    try {
      const { toUserId, amount, transactionPassword } = req.body;
      const fromUserId = req.user.userId;

      if (!toUserId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid Target User ID and Amount are required." });
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
      // 🔹 2. 🔥 REAL BALANCE CHECK (Locked $30 Showcase Logic) 🔥
      // =======================================================
      // Leader ka total balance minus 30 = Usable Balance
      const usableBalance = sender.walletBalance - 30;

      if (amount > usableBalance) {
        return res.status(400).json({ 
          message: `Insufficient Earned Balance! You cannot transfer the $30 Showcase Balance. You only have $${Math.max(0, usableBalance).toFixed(2)} available to transfer.` 
        });
      }

      // 🔹 3. Deduct and Add
      sender.walletBalance -= amount;
      receiver.walletBalance += amount;

      await sender.save();
      await receiver.save();

      // 🔹 4. Create Transactions
      const Transaction = require('../models/Transaction');

      await Transaction.create({
        userId: sender.userId,
        type: "transfer",
        amount: amount,
        fromUserId: sender.userId,
        toUserId: receiver.userId,
        description: `Fund Transferred to ${receiver.name} (${receiver.userId})`,
        status: "success",
        date: new Date()
      });

      await Transaction.create({
        userId: receiver.userId,
        type: "transfer",
        amount: amount,
        fromUserId: sender.userId,
        toUserId: receiver.userId,
        description: `Fund Received from ${sender.name} (${sender.userId})`,
        status: "success",
        date: new Date()
      });

      res.status(200).json({
        success: true,
        message: `$${amount} successfully transferred to ${receiver.userId}.`
      });

    } catch (error) {
      console.error("Leader Transfer Error:", error);
      res.status(500).json({ message: "Server error during leader transfer." });
    }
  }
);



  
// GLOBAL_POOLS array yahan rakhne ki ab zaroorat nahi hai kyunki cron job calculation kar raha hai.

// ==========================================
// 1. GET WITHDRAWABLE BALANCES API (UPDATED)
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
      pool: user.poolIncome || 0,             // ✨ NAYA: Daily Cron job wala Auto-Pool wallet
      isUserToppedUp: user.isToppedUp
    });

  } catch (err) {
    console.error("Withdrawable Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ==========================================
// 2. WITHDRAW POST API (Silent 50-50 Split + 10% Fee)
// ==========================================
router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const { items, transactionPassword } = req.body;

    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🛡️ BASIC CHECKS
    if (!user.isToppedUp) return res.status(400).json({ message: "Active ID (Top-up) is required to withdraw." });
    
    const isPasswordValid = (transactionPassword.toLowerCase() === user.transactionPassword.toLowerCase());
    if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No withdrawal items provided." });
    }

    // 💰 CALCULATE TOTAL AMOUNT
    let totalAmt = 0;
    for (let item of items) {
      totalAmt += Math.floor(parseFloat(item.amount));
    }
    
    if (totalAmt < 5) {
        return res.status(400).json({ message: "Minimum total withdrawal amount is $5." });
    }

    // =========================================================
    // 🔥 STEP 1: PRE-CHECK LOGIC (GATEKEEPER - STRICT SECURITY)
    // =========================================================
    
    let simDirectWallet = user.directIncome || 0;
    let simLevelWallet = user.levelIncome || 0;
    let simRewardWallet = user.rewardIncome || 0;
    let simPoolWallet = user.poolIncome || 0; // ✨ NAYA: Daily pool wallet

    for (let item of items) {
      const amt = Math.floor(parseFloat(item.amount));
      if (amt <= 0) return res.status(400).json({ message: "Invalid amount detected." });

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
      else if (item.source === "pool") {
        if (simPoolWallet < amt) return res.status(400).json({ message: "Insufficient Auto-Pool balance." });
        simPoolWallet -= amt; // ✨ Minus from simulated pool wallet
      } 
      else {
        return res.status(400).json({ message: `Unknown source: ${item.source}` });
      }
    }

    // =========================================================
    // 🔥 STEP 2: REAL DEDUCTION & SILENT SPLIT LOGIC
    // =========================================================
    for (let item of items) {
      const amt = Math.floor(parseFloat(item.amount));

      // 1. Deduct full requested amount from User's specific income box
      if (item.source === "direct") user.directIncome -= amt;
      else if (item.source === "level") user.levelIncome -= amt;
      else if (item.source === "reward") user.rewardIncome -= amt;
      else if (item.source === "pool") user.poolIncome -= amt; // ✨ NAYA: Seedha daily wallet se minus

      // 💎 SILENT 50/50 SPLIT
      const withdrawShare = amt * 0.50; // Aadha crypto withdrawal ke liye
      const walletShare = amt * 0.50;   // Aadha re-topup wallet ke liye

      // 🛑 10% FEE ON BOTH SHARES (Effective 45% / 45%)
      const withdrawFee = withdrawShare * 0.10; 
      const walletFee = walletShare * 0.10;     

      const netWithdrawAmount = withdrawShare - withdrawFee; // User ke address pe jayega
      const netWalletAmount = walletShare - walletFee;       // User ke Top-up wallet me aayega

      // Add to Main Top-up Wallet
      user.walletBalance = (user.walletBalance || 0) + netWalletAmount;
      user.totalWithdrawn = (user.totalWithdrawn || 0) + amt; 

      // Create Record for Crypto Withdrawal
      await Withdrawal.create({
        userId: user.userId,
        source: item.source, 
        grossAmount: withdrawShare,
        fee: withdrawFee, 
        netAmount: netWithdrawAmount,
        walletAddress: user.walletAddress || "Not Provided",
        status: "pending",
        date: new Date()
      });

      // Transaction History (Normal Text, No mention of split)
      
      // 1. Withdrawal request log
      await Transaction.create({
        userId: user.userId,
        type: "withdrawal",
        source: item.source,
        amount: withdrawShare,
        description: `Withdrawal from ${item.source.toUpperCase()}`, // Normal text
        status: "pending"
      });

      // 2. Re-credit to wallet log
      await Transaction.create({
        userId: user.userId,
        type: "credit",
        source: "system",
        amount: netWalletAmount,
        description: `Wallet Credit from ${item.source.toUpperCase()}`, // Normal text
        status: "success"
      });
    }

    // Save Database
    await user.save();

    // Normal Success Message
    return res.json({ 
      success: true, 
      message: "Withdrawal request submitted successfully." 
    });

  } catch (err) {
    console.error("Withdraw Error:", err);
    res.status(500).json({ message: "Server processing error." });
  }
});

// 🔥 Naya Dedicated Route: Sirf Promo Users ke liye
// 🔥 Dedicated Route: Sirf Promo Simulation ke liye
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

    // 💰 Calculation (Sirf withdraw amount nikalne ke liye)
    let totalAmt = 0;
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        totalAmt += Math.floor(parseFloat(item.amount) || 0);
      });
    }

    if (totalAmt <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount." });
    }

    // 🔥 RANDOM NAME LOGIC: Jaisa topup mein tha
    const firstNames = [
      "Aarav", "Abhay", "Abhinav", "Aditya", "Adarsh", "Akash", "Akhil", "Alok", "Aman", "Amar", "Amit", "Amol", "Anand", "Aniket", "Anirudh", "Ankit", "Ankur", "Anmol", "Ansh", "Anshul", "Anuj", "Anupam", "Apoorv", "Arjun", "Arnav", "Aryan", "Ashish", "Ashok", "Ashutosh", "Atul", "Ayush",
      "Balram", "Bharat", "Bhaskar", "Bhavish", "Bhupendra", "Brijesh", "Chaitanya", "Chandan", "Chetan", "Chirag", "Daksh", "Darpan", "Deepak", "Dev", "Devendra", "Dharmendra", "Dheeraj", "Dhruv", "Digvijay", "Dilip", "Dinesh", "Divyansh", "Gajendra", "Ganesh", "Gaurav", "Gautam", "Girish", "Gopal", "Gulshan", "Gunjit",
      "Harish", "Harsh", "Harshit", "Hemant", "Himanshu", "Hitesh", "Inder", "Ishaan", "Ishwar", "Jagdish", "Jaideep", "Jatin", "Jitendra", "Jugal", "Kabir", "Kailash", "Kamal", "Kapil", "Karan", "Kartik", "Kaushal", "Ketan", "Kiran", "Kishore", "Krishan", "Krunal", "Kuldeep", "Kunal", "Kushagra", "Laksh", "Lalit", "Lokesh",
      "Madhav", "Mahendra", "Mahesh", "Manas", "Manish", "Manit", "Manoj", "Mayank", "Milind", "Mohit", "Mukesh", "Mukul", "Nakul", "Naman", "Narendra", "Naresh", "Navneet", "Neeraj", "Nikhil", "Nilesh", "Nishant", "Nitin", "Om", "Omprakash", "Pankaj", "Parth", "Pawan", "Pradeep", "Prafull", "Pranjal", "Prateek", "Pratosh", "Praveen", "Prayas", "Puneet", "Pushkar",
      "Raghav", "Rahul", "Rajat", "Rajeev", "Rajesh", "Rajnish", "Rakesh", "Ram", "Ramesh", "Ranveer", "Ratan", "Ravi", "Ravindra", "Rishi", "Ritesh", "Rohan", "Rohit", "Ronak", "Rupesh", "Sachin", "Sagar", "Sahil", "Sajid", "Sameer", "Sandeep", "Sanjay", "Sanjeev", "Santosh", "Sarthak", "Satish", "Saurabh", "Shakti", "Shantanu", "Sharad", "Shashank", "Shikhar", "Shivam", "Shravan", "Shreyas", "Shubham", "Siddharth", "Somesh", "Subhash", "Sudhanshu", "Sudhir", "Sujit", "Sumit", "Sunil", "Suraj", "Suresh", "Surya", "Sushant", "Swapnil",
      "Tanmay", "Tarun", "Tejas", "Trilok", "Tushar", "Uday", "Udit", "Ujjwal", "Umang", "Utkarsh", "Vaibhav", "Varun", "Vicky", "Vidit", "Vijay", "Vikram", "Vimal", "Vinay", "Vineet", "Vinod", "Vipin", "Viplav", "Viraaj", "Vishal", "Vishnu", "Vishwa", "Vivek", "Vyom", "Yash", "Yogesh", "Yuvraj"
    ];

    const lastNames = [
      "Agarwal", "Ahluwalia", "Arora", "Babu", "Bajpai", "Bakshi", "Banerjee", "Bansal", "Bhardwaj", "Bhatia", "Bhatt", "Biswas", "Bose", "Chahal", "Chakraborty", "Chatterjee", "Chauhan", "Chhabra", "Choudhary", "Chopra", "Das", "Dayal", "Deshmukh", "Devi", "Dhillon", "Dixit", "Dubey", "Dutta", "Dwivedi", "Gadhavi", "Gandhi", "Garg", "Gautam", "Gill", "Goel", "Gokhale", "Goswami", "Gowda", "Gupta", "Iyer", "Jadeja", "Jain", "Jha", "Joshi", "Kapoor", "Kashyap", "Kaur", "Khanna", "Khatri", "Kulkarni", "Kumar", "Luthra", "Mahajan", "Malhotra", "Malik", "Maurya", "Mehra", "Mehta", "Menon", "Mishra", "Mittal", "Modi", "Mukherjee", "Nair", "Ojha", "Pandey", "Pant", "Parekh", "Paswan", "Patel", "Patil", "Pillai", "Prasad", "Puri", "Rai", "Rajput", "Rao", "Rastogi", "Rathore", "Rawat", "Reddy", "Sahni", "Saini", "Saksena", "Sarkar", "Saxena", "Sen", "Sethi", "Shah", "Sharma", "Shekhawat", "Shetty", "Shinde", "Shukla", "Singh", "Singhal", "Sinha", "Somani", "Soni", "Srivastava", "Talwar", "Taneja", "Thakur", "Tiwari", "Tripathi", "Trivedi", "Tyagi", "Upadhyay", "Varma", "Vashisht", "Verma", "Vyas", "Yadav"
    ];

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${randomFirstName} ${randomLastName}`;

    // 2. Unique ID Generation for the Dummy Withdrawal User
    let dummyId;
    let isUnique = false;
    while (!isUnique) {
      dummyId = Math.floor(1000000 + Math.random() * 9000000);
      const existsInReal = await User.findOne({ userId: dummyId });
      const existsInDummy = await DummyUser.findOne({ userId: dummyId });
      if (!existsInReal && !existsInDummy) isUnique = true;
    }

    // 3. Save in DUMMY USER table (Withdrawal ke liye virtual user create ho raha hai)
    const newDummy = new DummyUser({
      userId: dummyId,
      name: fullName,
      email: `demo_withdraw_${dummyId}@ cryptocommunity.live`,
      password: "demo_password_123",
      country: "India",
      mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`, 
      // Agar aapke schema mein withdraw amount save karne ka field hai, to use yahan add kar sakte hain:
      // withdrawAmount: totalAmt, 
      sponsorId: currentUser.userId
    });
    await newDummy.save();

    // 4. Record in Dummy Transaction
    await DummyTransaction.create({
      userId: currentUser.userId,
      generatedId: dummyId,
      amount: totalAmt,
      type: "Withdrawal", // Zaroori nahi hai par list mein filter karne ke kaam aayega
      description: `Demo withdrawal of $${totalAmt} generated for ID ${dummyId}`
    });

    // =========================================================
    // 🚫 NO REAL DATABASE CHANGES
    // Real balance minus nahi hoga aur real record nahi banega.
    // =========================================================

    return res.json({ 
      success: true, 
      generatedId: dummyId, 
      name: fullName,
      message: `Promo withdrawal of $${totalAmt} processed (Bypassed & No balance deduction).` 
    });

  } catch (err) {
    console.error("Promo Withdraw Simulation Error:", err);
    res.status(500).json({ message: "Server processing error: " + err.message });
  }
});


router.get('/wallet-history/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Fetch transactions but ignore topup with "PROMOTION"
    const txs = await Transaction.find({
      userId,
      $or: [
        { type: { $in: ['deposit', 'transfer'] } },
        { 
          type: 'topup',
          description: { $exists: true, $ne: null, $not: /PROMOTION/i } // ignore promo topups
        }
      ]
    }).sort({ date: -1 });

    res.json({ success: true, history: txs });
  } catch (err) {
    console.error("Wallet history error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


 
// ---------------------------
// =========================================================
// 🔥 NEW: CREDIT TO WALLET ($30 PLAN WITH 4 INCOMES)
// =========================================================
router.post(
  "/credit-to-wallet",
  authMiddleware,
  // checkFeature("allowCreditToWallet"), // Agar middleware ho toh uncomment kar lena
  async (req, res) => {
    try {
      const { items, transactionPassword, userId } = req.body;

      const user = await User.findOne({ userId: Number(userId) });
      if (!user) return res.status(404).json({ message: "User not found" });

      // 🛡️ BASIC CHECKS
      if (!user.isToppedUp) return res.status(400).json({ message: "You need an Active ID (Top-up required)." });
      
      const isPasswordValid = (transactionPassword.toLowerCase() === user.transactionPassword.toLowerCase());
      if (!isPasswordValid) return res.status(403).json({ message: "Invalid Transaction Password." });

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Please enter an amount to credit." });
      }

      // 💰 CALCULATE TOTAL AMOUNT
      let totalAmt = 0;
      for (let item of items) {
        const amt = Math.floor(parseFloat(item.amount));
        if (amt <= 0) return res.status(400).json({ message: "Invalid amount detected." });
        totalAmt += amt;
      }

      if (totalAmt < 5) {
        return res.status(400).json({ message: `Minimum total credit amount is $5. You entered $${totalAmt}.` });
      }

      // =========================================================
      // 🔥 REAL DEDUCTION LOGIC
      // =========================================================
      
      // Withdraw API ki tarah hi pehle Pool ka total check karenge
      let unlockedPoolIncome = 0;
      let cumulativeGlobalTeam = 0;
      // Note: GLOBAL_POOLS array aapki is file me define honi chahiye
      GLOBAL_POOLS.forEach((lvl) => {
        cumulativeGlobalTeam += lvl.globalTeam;
        if ((user.globalTeamCount || 0) >= cumulativeGlobalTeam && (user.directCount || 0) >= lvl.reqDirects) {
          unlockedPoolIncome += lvl.earning;
        }
      });
      let simPendingPool = user.pendingWithdrawals || 0;
      let availablePoolBalance = Math.max(0, unlockedPoolIncome - simPendingPool);

      // Pre-check balances
      let simDirect = user.directIncome || 0;
      let simLevel = user.levelIncome || 0;
      let simReward = user.rewardIncome || 0;

      for (let item of items) {
        const amt = Math.floor(parseFloat(item.amount));

        if (item.source === "direct") {
          if (simDirect < amt) return res.status(400).json({ message: "Insufficient Direct Income." });
          simDirect -= amt;
        } else if (item.source === "level") {
          if (simLevel < amt) return res.status(400).json({ message: "Insufficient Level Income." });
          simLevel -= amt;
        } else if (item.source === "reward") {
          if (simReward < amt) return res.status(400).json({ message: "Insufficient Team Reward Income." });
          simReward -= amt;
        } else if (item.source === "pool") {
          if (availablePoolBalance < amt) return res.status(400).json({ message: "Insufficient Single Leg Community Income." });
          availablePoolBalance -= amt;
        } else {
          return res.status(400).json({ message: `Invalid source: ${item.source}` });
        }
      }

      // Final Deductions
      for (let item of items) {
        const amt = Math.floor(parseFloat(item.amount));
        if (item.source === "direct") user.directIncome -= amt;
        else if (item.source === "level") user.levelIncome -= amt;
        else if (item.source === "reward") user.rewardIncome -= amt;
        else if (item.source === "pool") user.pendingWithdrawals = (user.pendingWithdrawals || 0) + amt;
      }

      // =========================================================
      // 🔥 WALLET UPDATE & TRANSACTION LOGS
      // =========================================================
      const totalFee = totalAmt * 0.10; 
      const totalNetAmount = totalAmt - totalFee; 

      // 1. User ka wallet balance ek saath badhao
      user.walletBalance = (user.walletBalance || 0) + totalNetAmount;
      await user.save();

      // 2. Transaction Logs
      for (let item of items) {
        const grossItemAmt = Math.floor(parseFloat(item.amount));
        const itemFee = grossItemAmt * 0.10;
        const netItemAmt = grossItemAmt - itemFee;

        await Transaction.create({
          userId: user.userId,
          type: "credit_to_wallet",
          source: item.source, 
          amount: netItemAmt,         
          grossAmount: grossItemAmt,  
          netAmount: netItemAmt,      
          fee: itemFee,                  
          walletBalance: user.walletBalance,
          description: `Credited $${netItemAmt} after 10% fee (${item.source.toUpperCase()})`,
          status: "success",
          date: new Date(),
        });
      }

      res.json({
        success: true,
        message: `Successfully credited $${totalNetAmount} after 10% deduction`,
        walletBalance: user.walletBalance
      });

    } catch (err) {
      console.error("Credit-to-wallet error:", err);
      res.status(500).json({ message: "Server processing error" });
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
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const txns = await Transaction.find({
      $or: [
        { userId },          // normal transactions
        { toUserId: userId }, // incoming transfers
      ],
    }).sort({ createdAt: -1 });

    res.json(txns);
  } catch (err) {
    console.error("Transaction history error:", err);
    res.status(500).json({ message: 'Transaction history error' });
  }
});


// 🔹 Get Withdrawal History
 



// GET /api/wallet/topup-history/:userId
// GET /api/wallet/topup-history/:userId
router.get("/topup-history/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId); // ensure numeric

    // Fetch only actual top-ups for the user
    const topups = await Transaction.find({ 
      userId, 
      type: "topup" // updated to match new schema
    }).sort({ createdAt: -1 }); // latest first

    res.json(topups); // return array of top-up transactions
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
router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    // 1. User validation
    const user = await User.findOne({ userId }).select('-password -txnPassword -__v');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 🔥 FIX FOR OLD DATA: Agar database me totalRewardIncome nahi hai, toh add kar do
    if (!user.totalRewardIncome && user.rewardIncome > 0) {
        user.totalRewardIncome = user.rewardIncome;
        await user.save(); // Data hamesha ke liye save ho jayega
    }

    // 2. Lifetime incomes nikalna (Helper function se jisme ab reward history bhi hai)
    const life = await getLifetimeIncomes(userId);

    // 3. Current Plan Income calculation
    const planKeys = ["plan1", "plan2", "plan3", "plan4", "plan5", "plan6"];
    let currentTotalPlanIncome = 0;

    planKeys.forEach(key => {
      currentTotalPlanIncome += calculatePackageEarnings(user.packages, key);
    });

    // 4. Final Response (Frontend ko yahi format chahiye)
    res.json({
      success: true,
      user: user, // Frontend ko Global Growth calculate karne ke liye user chahiye
      walletBalance: user.walletBalance || 0,
      
      // ✅ DASHBOARD LIFETIME TOTALS (Kabhi minus nahi honge)
      income: {
         totalDirectIncome: life.direct || user.totalDirectIncome || user.directIncome || 0,
         totalLevelIncome:  life.level  || user.levelIncome || 0,
         totalSpinIncome:   life.spin   || user.spinIncome || 0,
         totalRewardIncome: life.reward || user.totalRewardIncome || user.rewardIncome || 0,
         planIncome:        currentTotalPlanIncome || 0
      },

      // ✅ WITHDRAWAL KE LIYE CURRENT BALANCE (Jo minus hota hai)
      directIncome: user.directIncome || 0,
      levelIncome:  user.levelIncome || 0,
      spinIncome:   user.spinIncome || 0,
      rewardIncome: user.rewardIncome || 0, 

      totalLifetimeIncome: (life.direct + life.level + currentTotalPlanIncome + life.spin + life.reward)
    });

  } catch (err) {
    console.error("Fetch Wallet Error:", err);
    res.status(500).json({ success: false, message: "Server error while fetching wallet" });
  }
});

module.exports = router;