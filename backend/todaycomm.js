// require('dotenv').config();
// const mongoose = require('mongoose');
// const User = require('./models/User'); // Path check kar lena

// const fixCapping = async () => {
//     try {
//         console.log("⏳ Connecting to DB...");
//         await mongoose.connect(process.env.MONGO_URI);
        
//         console.log("🛠️ Fixing jammed capping counts...");
//         // Sabhi users jinka count 20 se upar galti se chala gaya hai, unko 0 kar do
//         const result = await User.updateMany(
//             { todayGlobalTeamAdded: { $gt: 20 } }, 
//             { $set: { todayGlobalTeamAdded: 0 } }
//         );
        
//         console.log(`✅ Fixed! ${result.modifiedCount} users ki capping reset ho gayi.`);
//         process.exit(0);
//     } catch (err) {
//         console.error("❌ Error:", err);
//         process.exit(1);
//     }
// };

// fixCapping();