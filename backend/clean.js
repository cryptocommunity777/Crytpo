// const mongoose = require('mongoose');
// require('dotenv').config(); // Aapki .env file se MONGO_URI uthayega
// const User = require('./models/User'); // Apne User model ka path check kar lena

// // 🔥 Sirf process.env.MONGO_URI use karega
// const MONGO_URL = process.env.MONGO_URI; 

// if (!MONGO_URL) {
//     console.error("❌ Error: MONGO_URI .env file me nahi mila!");
//     process.exit(1);
// }

// const cleanFakeAccounts = async () => {
//     try {
//         console.log("⏳ Connecting to Live Database...");
//         await mongoose.connect(MONGO_URL);
//         console.log("✅ Database connected successfully!");

//         console.log("🧹 Finding and deleting fake accounts & Directs of ID 4403502...");
        
//         // 🔥 Naya Filter: Ya toh naam me kachra ho (Bots), YA FIR unka sponsor 4403502 ho
//         const filter = { 
//             $or: [
//                 { name: { $regex: "ZAP|rtret|<|%|Set-cookie", $options: "i" } },
//                 { sponsorId: 4403502 } // 👈 Ye line 4403502 ke sabhi directs ko uda degi
//             ]
//         };

//         const result = await User.deleteMany(filter);

//         console.log(`🎉 Cleanup Successful! Deleted ${result.deletedCount} accounts.`);
        
//         // Kaam hone ke baad connection close kar do
//         mongoose.connection.close();
//         process.exit(0);

//     } catch (error) {
//         console.error("❌ Error running cleanup script:", error);
//         process.exit(1);
//     }
// };

// cleanFakeAccounts();