// C:\Users\HP\Desktop\Cryptocommunity\backend\cron\fastTrackCron.js
const cron = require('node-cron');
const User = require('../models/User');
const FastTrack = require('../models/FastTrack');
const Transaction = require('../models/Transaction');

cron.schedule('15 1 * * *', async () => {
    console.log('⏳ Running Fast Track Daily Bonus Cron (IST)...');
    try {
        const activeTracks = await FastTrack.find({ status: 'active' });
        let count = 0;
        
        const todayStr = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
        const now = new Date();

        // 🔥 TIME CONFIGURATIONS
        const OLD_OFFER_END = new Date("2026-06-10T23:59:59+05:30");   // 10 June ki raat tak purana plan
        const NEW_OFFER_START = new Date("2026-06-14T00:00:00+05:30"); // 14 June ki shuruwat
        // 👇 YAHAN NAYI DATE ADD KI HAI (6 July raat 11:59 PM Offer Close) 👇
        const NEW_OFFER_END = new Date("2026-07-06T23:59:59+05:30"); 

        for (let track of activeTracks) {
            const trackCreationDate = track.createdAt ? new Date(track.createdAt) : track._id.getTimestamp();
            const sponsor = await User.findOne({ userId: track.sponsorId });
            
            if (!sponsor) continue;

            // 🛑 LEADER BLOCKER
            if (sponsor.role === 'leader') {
                track.status = 'completed';
                await track.save();
                console.log(`🚫 Fast Track Skipped & Closed: Sponsor ${sponsor.userId} is a Leader.`);
                continue; 
            }

            let isEligibleForPayout = false;
            let amountToPay = track.dailyAmount;

            // ==========================================
            // 🔹 LOGIC 1: PURANA OFFER (10 June ya usse pehle)
            // ==========================================
            if (trackCreationDate <= OLD_OFFER_END) {
                isEligibleForPayout = true; 
            } 
            // ==========================================
            // 🔹 LOGIC 2: BLACKOUT ZONE (11 June se 13 June)
            // ==========================================
            else if (trackCreationDate > OLD_OFFER_END && trackCreationDate < NEW_OFFER_START) {
                track.status = 'completed';
                await track.save();
                continue;
            }
            // ==========================================
            // 🔹 LOGIC 3: NAYA ADD-ON OFFER (14 June se 6 July Tak!)
            // ==========================================
            else {
                if (!sponsor.isToppedUp || !sponsor.topUpDate) continue;

                const sponsorTopUpDate = new Date(sponsor.topUpDate);
                // Deadline 1: Sponsor ke top-up se 144 Hours
                const hourDeadline = new Date(sponsorTopUpDate.getTime() + (144 * 60 * 60 * 1000));
                
                // 🔥 SMART LOGIC: Final Cutoff wo hogi jo pehle aayegi (Ya toh 144 ghante, ya phir 6 July ki raat)
                const finalCutoff = new Date(Math.min(hourDeadline.getTime(), NEW_OFFER_END.getTime()));

                // Agar record final cutoff ke baad ka hai -> Offer band ho chuka hai, Reject karo
                if (trackCreationDate > finalCutoff) {
                    track.status = 'completed';
                    await track.save();
                    console.log(`🚫 Track Failed: Direct #${track.directUserId} joined AFTER Final Cutoff (144h or 6 July).`);
                    continue;
                }

                // Ginti sirf un directs ki hogi jo Start Date aur Final Cutoff ke beech aaye hain
                const qualifiedDirectsCount = await User.countDocuments({
                    sponsorId: sponsor.userId,
                    isToppedUp: true,
                    topUpDate: {
                        $gte: NEW_OFFER_START, 
                        $lte: finalCutoff 
                    }
                });

                if (qualifiedDirectsCount >= 6) {
                    isEligibleForPayout = true;
                    amountToPay = 1; 
                } else {
                    // Agar aaj ka time final cutoff ko cross kar chuka hai aur 6 direct nahi hue, toh fail
                    if (now > finalCutoff) {
                        track.status = 'completed';
                        await track.save();
                        console.log(`🚫 Track Failed: Sponsor ${sponsor.userId} missed target before Offer Closed.`);
                    }
                    continue; 
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