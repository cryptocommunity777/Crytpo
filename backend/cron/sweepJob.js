const cron = require('node-cron');
const User = require('../models/User');
const { sweepFunds } = require('../controllers/depositController');

const startSweeper = () => {
    // Har 2 minute me chalega
    cron.schedule('*/1 * * * *', async () => {
        console.log("🔍 Running automated deposit check...");
        
        try {
            const usersWithWallets = await User.find({ 
                depositAddress: { $exists: true, $ne: null } 
            });

            console.log(`Total Wallets to check: ${usersWithWallets.length}`);

            // 🚀 BATCH PROCESSING: Ek sath 20 users check karenge taaki speed 20x ho jaye
            const batchSize = 20; 
            
            for (let i = 0; i < usersWithWallets.length; i += batchSize) {
                const batch = usersWithWallets.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (user) => {
                    try {
                        await sweepFunds(user._id);
                    } catch (err) {
                        // Silent catch taaki ek fail ho toh baki na ruke
                    }
                }));
                
                // ⏱️ Delay of 500ms between batches to keep RPC safe
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            console.log("✅ Automated check complete.");
        } catch (error) {
            console.error("❌ Error during automated sweep:", error);
        }
    });
};

module.exports = startSweeper;