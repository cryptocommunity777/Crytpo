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
        
        // 🔥 Exact IST Date calculation for "Today"
        const todayStr = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }); 

        // 🔥 OFFER DEADLINE: 10 June 2026, 11:59:59 PM IST
        const OFFER_CUTOFF_DATE = new Date("2026-06-10T23:59:59+05:30");

        for (let track of activeTracks) {

            // 🔥 FIX: Check if track was created AFTER the cutoff date
            const trackCreationDate = track.createdAt ? new Date(track.createdAt) : track._id.getTimestamp();

            if (trackCreationDate > OFFER_CUTOFF_DATE) {
                track.status = 'completed';
                await track.save();
                console.log(`🚫 Blocked Fast Track for Sponsor ${track.sponsorId} - Direct made after 10th June.`);
                continue; 
            }

            // 🔥 BULLETPROOF CHECK (IST Based): Agar aaj paisa mil chuka hai, toh aage badho
            const lastPaidStr = track.lastPaidDate 
                ? new Date(track.lastPaidDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) 
                : null;
            
            if (lastPaidStr === todayStr) {
                continue; 
            }

            const sponsor = await User.findOne({ userId: track.sponsorId });
            if (!sponsor) continue;

            const amountToPay = track.dailyAmount;

            // Paisa do aur din badhao
            sponsor.walletBalance = (sponsor.walletBalance || 0) + amountToPay;
            
            // 👇👇👇 5th box ke liye updates 👇👇👇
            sponsor.fastTrackIncome = (sponsor.fastTrackIncome || 0) + amountToPay;
            sponsor.totalFastTrackIncome = (sponsor.totalFastTrackIncome || 0) + amountToPay;
            // 👆👆👆 ==================================================== 👆👆👆

            track.daysPaid += 1;
            
            // Aaj ki date set kar do
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
                date: new Date() // Transaction me UTC save hoga (jo perfectly fine hai, frontend convert kar lega)
            });

            count++;
        }
        
        console.log(`✅ Fast Track Cron completed. Distributed to ${count} valid records. Offer deadline enforced!`);
    } catch (err) {
        console.error('❌ Fast Track Cron Error:', err);
    }
}, {
    // 🔥 Force Cron to run exactly at 12:08 AM IST
    scheduled: true,
    timezone: "Asia/Kolkata" 
});