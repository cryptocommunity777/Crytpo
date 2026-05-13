// backend/cron/sweepJob.js
const cron = require('node-cron');
const User = require('../models/User');
const { sweepFunds } = require('../controllers/depositController');

const startSweeper = () => {
    // Har 15 minute me chalega
    cron.schedule('*/2 * * * *', async () => {
        console.log("🔍 Running automated deposit check...");
        
        try {
            const usersWithWallets = await User.find({ 
                depositAddress: { $exists: true, $ne: null } 
            });

            console.log(`Total Wallets to check: ${usersWithWallets.length}`);

            for (const user of usersWithWallets) {
                try {
                    await sweepFunds(user._id);
                    // ⏱️ Delay of 1 second between each user check. 
                    // Ye RPC block/ban hone se bachayega aur saare users properly check honge.
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (err) {
                    console.log(`⚠️ User ${user.userId} sweep issue, skipping to next...`);
                }
            }
            
            console.log("✅ Automated check complete.");
        } catch (error) {
            console.error("❌ Error during automated sweep:", error);
        }
    });
};

module.exports = startSweeper;