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
    // 🔥 Har 5 minute me chalega (FREE Check & Paid Sweep)
    // Abhi testing ke liye aap isko '*/1 * * * *' (1 min) rakh sakte hain, par live me 5 mins ('*/5 * * * *') best hai.
    cron.schedule('*/4 * * * *', async () => {
        console.log("🔍 Running automated deposit check (Hybrid Mode)...");
        
        try {
            const usersWithWallets = await User.find({ 
                depositAddress: { $exists: true, $ne: null } 
            });

            console.log(`Total Wallets to check: ${usersWithWallets.length}`);

            // 🚀 SEQUENTIAL PROCESSING: Ek-ek karke check karenge taaki Server CPU aur Memory par Load ZERO ho!
            for (let i = 0; i < usersWithWallets.length; i++) {
                const user = usersWithWallets[i];
                
                try {
                    // Check karo
                    await sweepFunds(user._id);
                } catch (err) {
                    // Silent fail taaki agla wallet check ho sake
                }

                // ⏱️ DELAY: Har ek user ke check ke baad adhe second (500ms) ka aaram. 
                // Isse na toh Free RPC block karega aur na hi aapki site hang hogi.
                await new Promise(resolve => setTimeout(resolve, 500)); 
            }
            
            console.log("✅ Automated check complete. No Paid Ankr credits wasted!");
        } catch (error) {
            console.error("❌ Error during automated sweep:", error);
        }
    });
};

module.exports = startSweeper;