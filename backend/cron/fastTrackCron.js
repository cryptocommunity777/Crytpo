// C:\Users\HP\Desktop\Cryptocommunity\backend\cron\fastTrackCron.js
const cron = require('node-cron');
const User = require('../models/User');
const FastTrack = require('../models/FastTrack');
const Transaction = require('../models/Transaction');

cron.schedule('8 0 * * *', async () => {
    console.log('⏳ Running Fast Track Daily Bonus Cron (IST)...');
    try {
        const activeTracks = await FastTrack.find({ status: 'active' });
        let count = 0;
        
        const todayStr = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
        const now = new Date();

        // 🔥 TIME CONFIGURATIONS
        const OLD_OFFER_END = new Date("2026-06-10T23:59:59+05:30");   // 10 June ki raat tak purana plan
        // 👇 YAHAN TIME CHANGE KIYA HAI (14 June ki shuruwat, Raat 12:00 AM) 👇
        const NEW_OFFER_START = new Date("2026-06-14T00:00:00+05:30"); 

        for (let track of activeTracks) {
            const trackCreationDate = track.createdAt ? new Date(track.createdAt) : track._id.getTimestamp();
            const sponsor = await User.findOne({ userId: track.sponsorId });
            
            if (!sponsor) continue;

            let isEligibleForPayout = false;
            let amountToPay = track.dailyAmount; // Default amount purane offer ke liye

            // ==========================================
            // 🔹 LOGIC 1: PURANA OFFER (10 June ya usse pehle ke directs)
            // ==========================================
            if (trackCreationDate <= OLD_OFFER_END) {
                isEligibleForPayout = true; // Inko bina shart normal paisa milta rahega
            } 
            // ==========================================
            // 🔹 LOGIC 2: BLACKOUT ZONE (11 June se 13 June raat 11:59 PM tak)
            // ==========================================
            else if (trackCreationDate > OLD_OFFER_END && trackCreationDate < NEW_OFFER_START) {
                track.status = 'completed'; // Is time ke beech ke directs invalid hain
                await track.save();
                console.log(`🚫 Track Completed/Failed: Direct #${track.directUserId} joined during Blackout.`);
                continue;
            }
            // ==========================================
            // 🔹 LOGIC 3: NAYA ADD-ON OFFER (14 June, Raat 12:00 AM se)
            // ==========================================
            else {
                if (!sponsor.isToppedUp || !sponsor.topUpDate) continue;

                const sponsorTopUpDate = new Date(sponsor.topUpDate);
                // Sponsor ke top-up se exact 144 Hours (6 Days) ki deadline
                const deadline = new Date(sponsorTopUpDate.getTime() + (144 * 60 * 60 * 1000));

                // Agar ye direct lagane wala record sponsor ki 144-hour window ke bahar hai -> Reject
                if (trackCreationDate > deadline) {
                    track.status = 'completed';
                    await track.save();
                    console.log(`🚫 Track Failed: Direct #${track.directUserId} joined AFTER Sponsor's 144h window.`);
                    continue;
                }

                // 🔥 CRITICAL FIX: Ginti sirf 14 June 12:00 AM ke baad wale directs ki hogi!
                const qualifiedDirectsCount = await User.countDocuments({
                    sponsorId: sponsor.userId,
                    isToppedUp: true,
                    topUpDate: {
                        $gte: NEW_OFFER_START, // 👉 Strictly 14 June 12:00 AM se ginti shuru!
                        $lte: deadline         // 👉 Aur sponsor ki 6-din deadline ke andar!
                    }
                });

                if (qualifiedDirectsCount >= 6) {
                    isEligibleForPayout = true;
                    // 🔥 Naye offer ke liye HAR DIRECT KA $1 FIX KAR DIYA
                    amountToPay = 1; 
                } else {
                    // Agar 6 din ka timer khatam ho gaya aur 6 direct nahi huye, toh fail karo
                    if (now > deadline) {
                        track.status = 'completed';
                        await track.save();
                        console.log(`🚫 Track Failed: Sponsor ${sponsor.userId} missed 6 direct target within window.`);
                    }
                    continue; // Agar timer bacha hai toh wait karo
                }
            }

            // ==========================================
            // 🔹 PAYOUT LOGIC
            // ==========================================
            if (isEligibleForPayout) {
                const lastPaidStr = track.lastPaidDate 
                    ? new Date(track.lastPaidDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) 
                    : null;
                
                if (lastPaidStr === todayStr) {
                    continue; 
                }

                sponsor.walletBalance = (sponsor.walletBalance || 0) + amountToPay;
                sponsor.fastTrackIncome = (sponsor.fastTrackIncome || 0) + amountToPay;
                sponsor.totalFastTrackIncome = (sponsor.totalFastTrackIncome || 0) + amountToPay;

                track.daysPaid += 1;
                track.lastPaidDate = new Date(); 

                // Jab 10 din poore ho jayein toh offer completed
                if (track.daysPaid >= track.maxDays) {
                    track.status = 'completed';
                }

                await sponsor.save();
                await track.save();

                await Transaction.create({
                    userId: sponsor.userId,
                    type: 'fast_track',
                    source: 'fast_track',
                    amount: amountToPay,
                    grossAmount: amountToPay,
                    fromUserId: track.directUserId, 
                    description: `Fast Track Offer: Day ${track.daysPaid}/${track.maxDays} Bonus for Direct #${track.directUserId}`,
                    status: 'success',
                    date: new Date()
                });

                count++;
            }
        }
        
        console.log(`✅ Fast Track Cron completed. Distributed to ${count} valid records.`);
    } catch (err) {
        console.error('❌ Fast Track Cron Error:', err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" 
});