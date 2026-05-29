// C:\Users\HP\Desktop\Cryptocommunity\backend\cron\fastTrackCron.js
const cron = require('node-cron');
const User = require('../models/User');
const FastTrack = require('../models/FastTrack');
const Transaction = require('../models/Transaction');

// 🔥 TIME FIX: '0 2 * * *' = Raat 2:00 Baje, timezone = India
cron.schedule('0 2 * * *', async () => {
    console.log('⏳ Running Fast Track Daily Bonus Cron...');
    try {
        const activeTracks = await FastTrack.find({ status: 'active' });
        let count = 0;
        
        // Aaj ki date nikal lo (Sirf din, time nahi)
        const todayStr = new Date().toDateString(); 

        for (let track of activeTracks) {
            // 🔥 BULLETPROOF CHECK: Agar aaj paisa mil chuka hai, toh aage badho (Skip)
            if (track.lastPaidDate && track.lastPaidDate.toDateString() === todayStr) {
                continue; 
            }

            const sponsor = await User.findOne({ userId: track.sponsorId });
            if (!sponsor) continue;

            const amountToPay = track.dailyAmount;

            // Paisa do aur din badhao
            sponsor.walletBalance = (sponsor.walletBalance || 0) + amountToPay;
            
            // 👇👇👇 NAYA FIX: Ye dono lines add ki hain 5th box ke liye 👇👇👇
            sponsor.fastTrackIncome = (sponsor.fastTrackIncome || 0) + amountToPay;
            sponsor.totalFastTrackIncome = (sponsor.totalFastTrackIncome || 0) + amountToPay;
            // 👆👆👆 ==================================================== 👆👆👆

            track.daysPaid += 1;
            
            // Aaj ki date set kar do, taaki aaj dobara cron chale toh paisa na jaye
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
        
        console.log(`✅ Fast Track Cron completed. Distributed $1 to ${count} valid records. Double payment protected!`);
    } catch (err) {
        console.error('❌ Fast Track Cron Error:', err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" // 👉 Server chahe jahan ho, ye India ke time se raat 2 baje hi chalega
});