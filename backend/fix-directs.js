require('dotenv').config(); // 👈 .env file ko load karne ke liye
const mongoose = require('mongoose');
const User = require('./models/User'); // 👈 Apne User model ka sahi path yahan daalna

async function fixDirectCounts() {
  try {
    // 1. Database se connect karein (.env se URI le rahe hain)
    const MONGO_URI = process.env.MONGO_URI; 

    // Agar .env me MONGO_URI nahi mili toh script yahi rok do
    if (!MONGO_URI) {
        console.error("❌ Error: MONGO_URI is not defined in your .env file!");
        process.exit(1);
    }

    // 🔥 FIX: Naye Mongoose me extra options ki zaroorat nahi hoti
    await mongoose.connect(MONGO_URI);
    
    console.log("=== Database Connected Successfully ===");

    // 2. Saare aise users ko dhoondho jo Active (Topped Up) hain aur jinka koi sponsor hai
    const activeUsers = await User.find({ 
      isToppedUp: true, 
      sponsorId: { $exists: true, $ne: null } 
    }).lean();

    console.log(`Found ${activeUsers.length} total active users in the system.`);

    // 3. Ek map banayenge jahan har Sponsor ke actual active directs count honge
    const actualDirectCounts = {};

    for (const user of activeUsers) {
      if (user.sponsorId) {
        const sponsorIdStr = String(user.sponsorId).trim();
        if (sponsorIdStr) {
          actualDirectCounts[sponsorIdStr] = (actualDirectCounts[sponsorIdStr] || 0) + 1;
        }
      }
    }

    console.log("Calculating actual direct counts for each sponsor...");

    // 4. Ab database me har ek sponsor ka directCount update karenge
    let totalUpdated = 0;

    for (const sponsorId in actualDirectCounts) {
      const actualCount = actualDirectCounts[sponsorId];

      const query = isNaN(sponsorId) ? { userId: sponsorId } : { userId: Number(sponsorId) };
      const sponsor = await User.findOne(query);

      if (sponsor) {
        if ((sponsor.directCount || 0) !== actualCount) {
          await User.updateOne(query, { $set: { directCount: actualCount } });
          console.log(`✅ Fixed Sponsor ID [${sponsorId}]: Old Count: ${sponsor.directCount || 0} ➡️ New Actual Count: ${actualCount}`);
          totalUpdated++;
        }
      }
    }

    console.log(`\n=== MIGRATION COMPLETED ===`);
    console.log(`Total Sponsors fixed and updated: ${totalUpdated}`);

  } catch (error) {
    console.error("Error running the direct count fix script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

fixDirectCounts();