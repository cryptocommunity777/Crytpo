require("dotenv").config(); 
const mongoose = require("mongoose");
const cron = require("node-cron");
const User = require("./models/User");
const Transaction = require("./models/Transaction");

// ---------------------------
// 1. Helper: ROI Rate Calculator
// ---------------------------
const getDailyRate = (amount) => {
  if (amount <= 50) return 4;   // 4%
  if (amount <= 500) return 5;  // 5%
  return 6;                     // 6%
};

// ---------------------------
// 2. Migration: Numeric -> Object
// ---------------------------
async function migratePlanIncome() {
  const users = await User.find();
  for (const user of users) {
    let changed = false;
    
    // Fix: planIncome number to object
    if (typeof user.planIncome === "number") {
      console.log(`Migrating user ${user.userId} planIncome from number to object...`);
      user.planIncome = {
        plan1: user.planIncome,
        plan2: 0, plan3: 0, plan4: 0, plan5: 0, plan6: 0, plan7: 0,
      };
      changed = true;
    }
    
    // Fix: Ensure dailyROI plans exist
    if (user.dailyROI && user.dailyROI.length > 0) {
       user.dailyROI.forEach(roi => {
          if (!roi.plan) {
             // Try to guess plan based on amount or default to plan1
             const packageToPlan = { 10: "plan1", 25: "plan2", 50: "plan3", 100: "plan4", 200: "plan5", 500: "plan6", 1000: "plan7" };
             roi.plan = packageToPlan[roi.amount] || "plan1";
             changed = true;
          }
       });
    }

    if (changed) await user.save();
  }
  console.log("✅ Migration check completed.");
}

// ---------------------------
// 3. Daily ROI Credit Logic
// ---------------------------
async function runDailyPlanIncome() {
  console.log("⏰ Running Daily Plan Income Task...");

  const users = await User.find({ "dailyROI.0": { $exists: true } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of users) {
    let updated = false;

    // Ensure planIncome structure
    if (typeof user.planIncome !== "object" || user.planIncome === null) {
      user.planIncome = { plan1: 0, plan2: 0, plan3: 0, plan4: 0, plan5: 0, plan6: 0, plan7: 0 };
    }

    // Loop through each active ROI package
    for (const roi of user.dailyROI) {
      // Skip if completed
      if (roi.claimedDays >= roi.maxDays) continue;

      // Determine Last Credited Date
      const lastDate = roi.lastCreditedDate ? new Date(roi.lastCreditedDate) : new Date(roi.startDate);
      lastDate.setHours(0, 0, 0, 0);

      // Calculate how many days missed (e.g. if script didn't run yesterday)
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // We credit only if at least 1 day has passed
      // But ensure we don't exceed maxDays
      const daysToCredit = Math.min(
        roi.maxDays - roi.claimedDays,
        diffDays
      );

      if (daysToCredit <= 0) continue;

      // ✅ FIXED: Calculate ROI Amount (Percentage of Package)
      const rate = getDailyRate(roi.amount);
      const dailyAmount = (roi.amount * rate) / 100;
      const planName = roi.plan || "plan1"; 

      for (let i = 1; i <= daysToCredit; i++) {
        const creditDate = new Date(lastDate);
        creditDate.setDate(creditDate.getDate() + i);
        creditDate.setHours(0, 0, 0, 0);

        // Prevent Future Dates
        if (creditDate > today) break;

        // Check Duplicate Transaction for this specific date
        const alreadyCredited = await Transaction.exists({
          userId: user.userId,
          type: "plan_income",
          plan: planName,
          // Match roughly the same day
          date: { 
            $gte: creditDate, 
            $lt: new Date(creditDate.getTime() + 24 * 60 * 60 * 1000) 
          },
          package: roi.amount // Check against package amount to be precise
        });

        if (alreadyCredited) continue;

        // --- UPDATE ROI ---
        roi.totalEarned = (roi.totalEarned || 0) + dailyAmount;
        roi.claimedDays = (roi.claimedDays || 0) + 1;
        roi.lastCreditedDate = creditDate;

        roi.dailyDetails = roi.dailyDetails || [];
        roi.dailyDetails.push({
          day: roi.claimedDays,
          amount: dailyAmount,
          status: "claimed",
          date: creditDate,
        });

        // --- UPDATE WALLET / PLAN INCOME ---
        user.planIncome[planName] = (user.planIncome[planName] || 0) + dailyAmount;

        // --- CREATE TRANSACTION ---
        await Transaction.create({
          userId: user.userId,
          type: "plan_income",
          source: "plan",
          plan: planName,
          package: roi.amount,
          amount: dailyAmount,
          description: `Daily ROI Day ${roi.claimedDays} (${rate}%) for Package $${roi.amount}`,
          date: creditDate,
        });

        console.log(`✅ Credited $${dailyAmount.toFixed(2)} to User ${user.userId} (${planName}) for ${creditDate.toDateString()}`);
        updated = true;
      }
    }

    if (updated) await user.save();
  }

  console.log("✅ Daily Plan Income completed.");
}

// ---------------------------
// 4. Start Scheduler
// ---------------------------
const startCron = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected for Cron Job");
    }

    // Run Migration first
    await migratePlanIncome();

    // Schedule: Every Night at 12:05 AM
    cron.schedule("5 0 * * *", async () => {
      console.log("🕒 Cron Triggered: Running Daily Income...");
      await runDailyPlanIncome();
    });
    
    console.log("🚀 Cron Scheduler Active (12:05 AM Daily)");

  } catch (err) {
    console.error("❌ Cron Setup Error:", err);
  }
};

// Export for main server usage
module.exports = { startCron, runDailyPlanIncome };

// Allow direct execution: "node roiCron.js"
if (require.main === module) {
  startCron().then(() => {
     // Optional: Run immediately for testing
     // runDailyPlanIncome(); 
  });
}