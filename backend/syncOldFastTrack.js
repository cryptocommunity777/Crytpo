// C:\Users\HP\Desktop\Cryptocommunity\backend\syncOldFastTrack.js
const mongoose = require('mongoose');
const User = require('./models/User');
const FastTrack = require('./models/FastTrack');
require('dotenv').config();

const syncOldUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptocommunity");
        console.log("🔗 DB Connected. Scanning old users for Fast Track Offer...");

        // Saare active users ko uthao
        const allUsers = await User.find({ isToppedUp: true });
        let addedCount = 0;

        for (let sponsor of allUsers) {
            if (!sponsor.createdAt) continue; // Agar date nahi hai toh skip

            // Is sponsor ke saare Active Directs nikalo
            const directs = await User.find({ 
                sponsorId: sponsor.userId, 
                isToppedUp: true 
            });

            for (let direct of directs) {
                // Direct ka activation date (ya registration date)
                const directDate = direct.topUpDate || direct.createdAt;
                if (!directDate) continue;

                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                // Dekho direct kab laga sponsor ke joining ke mukable
                const timeDiff = new Date(directDate).getTime() - new Date(sponsor.createdAt).getTime();

                // Agar direct 30 din ke andar laga tha (0 se 30 days ke beech)
                if (timeDiff >= 0 && timeDiff <= thirtyDaysInMs) {
                    
                    // Check karo kya iski entry pehle se bani hui hai ya nahi
                    const existingEntry = await FastTrack.findOne({ 
                        sponsorId: sponsor.userId, 
                        directUserId: direct.userId 
                    });

                    // Agar nahi bani hai, toh bana do
                    if (!existingEntry) {
                        await FastTrack.create({
                            sponsorId: sponsor.userId,
                            directUserId: direct.userId,
                            dailyAmount: 1,
                            daysPaid: 0, // Inko bhi zero se start karke agle 10 din 1-1 dollar milega
                            maxDays: 10,
                            status: 'active'
                        });
                        addedCount++;
                        console.log(`✅ Added Fast Track: Sponsor ${sponsor.userId} <- Direct ${direct.userId}`);
                    }
                }
            }
        }

        console.log(`\n🎉 Sync Complete! Added ${addedCount} old valid records to Fast Track.`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Error syncing old users:", err);
        process.exit(1);
    }
};

syncOldUsers();