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

        // 🔥 TIME CONFIGURATIONS (ALL PHASES)
        const OLD_OFFER_END = new Date("2026-06-10T23:59:59+05:30");   // Old plan end
        
        const PHASE1_START = new Date("2026-06-14T00:00:00+05:30");    // First 6-direct offer start
        const PHASE1_END = new Date("2026-07-06T23:59:59+05:30");      // First 6-direct offer end
        
        // 👇 NAYA OFFER YAHAN SE SHURU HOGA (11 JULY RAT 12:00 AM) 👇
        const PHASE2_START = new Date("2026-07-11T00:00:00+05:30"); 

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
            // 🔹 1. PURANA OFFER (10 June ya usse pehle) - Keep Paying
            // ==========================================
            if (trackCreationDate <= OLD_OFFER_END) {
                isEligibleForPayout = true; 
            } 
            // ==========================================
            // 🔹 2. PHASE 1 OFFER (14 June se 6 July) - Target Done, Keep Paying
            // ==========================================
            else if (trackCreationDate >= PHASE1_START && trackCreationDate <= PHASE1_END) {
                if (!sponsor.isToppedUp || !sponsor.topUpDate) continue;
                
                const sponsorTopUpDate = new Date(sponsor.topUpDate);
                const hourDeadline = new Date(sponsorTopUpDate.getTime() + (144 * 60 * 60 * 1000));
                const finalCutoff = new Date(Math.min(hourDeadline.getTime(), PHASE1_END.getTime()));

                if (trackCreationDate > finalCutoff) {
                    track.status = 'completed'; await track.save(); continue;
                }

                const countDirects = await User.countDocuments({
                    sponsorId: sponsor.userId, isToppedUp: true,
                    topUpDate: { $gte: PHASE1_START, $lte: finalCutoff }
                });

                if (countDirects >= 6) {
                    isEligibleForPayout = true; amountToPay = 1; 
                } else if (now > finalCutoff) {
                    track.status = 'completed'; await track.save(); continue; 
                }
            }
            // ==========================================
            // 🔹 3. PHASE 2 OFFER RESTART (11 July Se) - New Targets
            // ==========================================
            else if (trackCreationDate >= PHASE2_START) {
                if (!sponsor.isToppedUp || !sponsor.topUpDate) continue;
                
                const sponsorTopUpDate = new Date(sponsor.topUpDate);
                // Deadline: 144 Hours (6 Days) from Sponsor's Topup Date
                const hourDeadline = new Date(sponsorTopUpDate.getTime() + (144 * 60 * 60 * 1000));

                if (trackCreationDate > hourDeadline) {
                    track.status = 'completed'; await track.save(); continue;
                }

                // Ginti sirf 11 July ke baad wale directs ki hogi
                const countDirects = await User.countDocuments({
                    sponsorId: sponsor.userId, isToppedUp: true,
                    topUpDate: { $gte: PHASE2_START, $lte: hourDeadline }
                });

                if (countDirects >= 6) {
                    isEligibleForPayout = true; amountToPay = 1; 
                } else if (now > hourDeadline) {
                    track.status = 'completed'; await track.save(); 
                    console.log(`🚫 Track Failed: Sponsor ${sponsor.userId} missed Phase 2 target.`);
                    continue; 
                }
            }
            // ==========================================
            // 🔹 4. BLACKOUT ZONES (11-13 June OR 7-10 July) - Reject
            // ==========================================
            else {
                track.status = 'completed';
                await track.save();
                continue;
            }

            // ==========================================
            // 💸 PAYOUT LOGIC (Common for all eligible)
            // ==========================================
            if (isEligibleForPayout) {
                const lastPaidStr = track.lastPaidDate 
                    ? new Date(track.lastPaidDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) 
                    : null;
                
                if (lastPaidStr === todayStr) {
                    continue; 
                }

                // 🔥 YAHAN CHANGE KIYA HAI: walletBalance ki jagah usdtBep20Balance
                sponsor.usdtBep20Balance = (sponsor.usdtBep20Balance || 0) + amountToPay;
                
                // Income records same rahenge
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
                    type: 'fast_track', source: 'fast_track', amount: amountToPay, grossAmount: amountToPay,
                    fromUserId: track.directUserId, 
                    // 🔥 Description me bhi update kar diya taaki history me saaf dikhe
                    description: `Fast Track Bonus: Day ${track.daysPaid}/${track.maxDays} for Direct #${track.directUserId} (Credited to USDT Wallet)`,
                    status: 'success', date: new Date()
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