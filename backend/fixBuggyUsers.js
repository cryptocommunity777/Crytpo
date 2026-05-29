// require('dotenv').config();
// const mongoose = require('mongoose');
// const readline = require('readline'); // 🔥 Terminal me input lene ke liye

// const MONGO_URI = process.env.MONGO_URI;

// if (!MONGO_URI) {
//     console.error("❌ Error: MONGO_URI .env file mein nahi mila. Kripya check karein!");
//     process.exit(1);
// }

// const userSchema = new mongoose.Schema({
//     userId: Number,
//     name: String,
//     globalTeamCount: Number,
//     directCount: Number
// }, { strict: false });

// const User = mongoose.models.User || mongoose.model('User', userSchema);

// // Terminal me sawal poochne ka function
// const askQuestion = (query) => {
//     const rl = readline.createInterface({
//         input: process.stdin,
//         output: process.stdout,
//     });
//     return new Promise(resolve => rl.question(query, ans => {
//         rl.close();
//         resolve(ans);
//     }));
// };

// const checkAndFixUsers = async () => {
//     try {
//         console.log("⏳ Connecting to Database...");
//         await mongoose.connect(MONGO_URI);
//         console.log("✅ Database Connected Successfully!\n");

//         const buggyUsers = await User.find({
//             globalTeamCount: { $gt: 2360 }, 
//             directCount: { $lt: 6 }         
//         }).select('userId name globalTeamCount directCount');

//         console.log(`🚨 TOTAL BUGGY USERS FOUND: ${buggyUsers.length}\n`);

//         if (buggyUsers.length === 0) {
//             console.log("🎉 Sab theek hai! Koi bhi user bina 6 direct ke aage nahi gaya.");
//             process.exit(0);
//         }

//         // PEHLE LIST DIKHAO
//         console.log("📋 BUGGY USERS KI LIST:");
//         buggyUsers.forEach((u, index) => {
//             console.log(`${index + 1}. ID: ${u.userId} | Name: ${u.name} | Current Team: ${u.globalTeamCount} | Directs: ${u.directCount}`);
//         });

//         console.log("\n=======================================================");
        
//         // 🛑 YAHAN AAYEGA YES/NO WALA OPTION 🛑
//         const answer = await askQuestion("⚠️ Kya aap in sabhi users ko wapas 2360 par LOCK karna chahte hain? (yes/no): ");

//         if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
//             console.log("\n🔧 Fixing Users... Sabko 2360 par wapas lock kar rahe hain...");
            
//             const bulkOps = buggyUsers.map(user => ({
//                 updateOne: {
//                     filter: { _id: user._id },
//                     update: { $set: { globalTeamCount: 2360 } }
//                 }
//             }));

//             const updateResult = await User.bulkWrite(bulkOps);
//             console.log(`✅ FIX COMPLETE! ${updateResult.modifiedCount} users ko wapas 2360 par laakar freeze kar diya gaya hai.`);
//         } else {
//             console.log("\n❌ Action Cancelled! Kisi bhi user ka data change nahi kiya gaya.");
//         }
        
//     } catch (err) {
//         console.error("\n❌ Error Aa Gaya:", err);
//     } finally {
//         mongoose.connection.close();
//         console.log("🔌 Database Connection Closed.");
//         process.exit(0);
//     }
// };

// checkAndFixUsers();