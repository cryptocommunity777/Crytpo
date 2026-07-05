// const cron = require('node-cron');
// const User = require('../models/User');
// const { sweepFunds } = require('../controllers/depositController');

// const startSweeper = () => {
//     // Har 2 minute me chalega
//     cron.schedule('*/5 * * * *', async () => {
//         console.log("🔍 Running automated deposit check...");
        
//         try {
//             const usersWithWallets = await User.find({ 
//                 depositAddress: { $exists: true, $ne: null } 
//             });

//             console.log(`Total Wallets to check: ${usersWithWallets.length}`);

//             // 🚀 BATCH PROCESSING: Ek sath 20 users check karenge taaki speed 20x ho jaye
//             const batchSize = 20; 
            
//             for (let i = 0; i < usersWithWallets.length; i += batchSize) {
//                 const batch = usersWithWallets.slice(i, i + batchSize);
                
//                 await Promise.all(batch.map(async (user) => {
//                     try {
//                         await sweepFunds(user._id);
//                     } catch (err) {
//                         // Silent catch taaki ek fail ho toh baki na ruke
//                     }
//                 }));
                
//                 // ⏱️ Delay of 500ms between batches to keep RPC safe
//                 await new Promise(resolve => setTimeout(resolve, 500));
//             }
            
//             console.log("✅ Automated check complete.");
//         } catch (error) {
//             console.error("❌ Error during automated sweep:", error);
//         }
//     });
// };

// module.exports = startSweeper;

const cron = require('node-cron');
const User = require('../models/User');
const { sweepFunds } = require('../controllers/depositController');

const startSweeper = () => {
    // 🔥 Har 5 minute me chalega (Par check completely FREE hoga!)
    cron.schedule('*/5 * * * *', async () => {
        console.log("🔍 Running automated deposit check (Hybrid Mode)...");
        
        try {
            const usersWithWallets = await User.find({ 
                depositAddress: { $exists: true, $ne: null } 
            });

            console.log(`Total Wallets to check: ${usersWithWallets.length}`);

            // 🚀 BATCH PROCESSING: Ek sath 20 users check karenge
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
                
                // ⏱️ Delay of 1 second between batches to keep Free RPCs safe and avoid getting blocked
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log("✅ Automated check complete. No Paid Ankr credits wasted!");
        } catch (error) {
            console.error("❌ Error during automated sweep:", error);
        }
    });
};

module.exports = startSweeper;