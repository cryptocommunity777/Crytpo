const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ MongoDB connected");

    const users = await User.find();
    console.log(`Found ${users.length} users to migrate.`);

    for (const user of users) {
      let needsUpdate = false;

      // 1️⃣ Migrate old planIncome (number → object)
      if (typeof user.planIncome === "number") {
        console.log(`Migrating planIncome for user ${user.userId}...`);
        user.planIncome = {
          plan1: user.planIncome,
          plan2: 0,
          plan3: 0,
          plan4: 0,
          plan5: 0,
          plan6: 0,
          plan7: 0,
        };
        needsUpdate = true;
      }

      // 2️⃣ Fix dailyROI missing 'plan'
      if (Array.isArray(user.dailyROI)) {
        for (const roi of user.dailyROI) {
          if (!roi.plan) {
            console.log(`Assigning default plan1 to user ${user.userId} dailyROI entry...`);
            roi.plan = "plan1"; // default to plan1
            needsUpdate = true;
          }

          // Optional: fix other missing fields
          roi.claimedDays = roi.claimedDays || 0;
          roi.maxDays = roi.maxDays || 10;
          roi.totalEarned = roi.totalEarned || 0;
          roi.dailyDetails = roi.dailyDetails || [];
        }
      }

      if (needsUpdate) {
        await user.save();
        console.log(`✅ Updated user ${user.userId}`);
      }
    }

    console.log("✅ User migration completed!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
