// const mongoose = require('mongoose');
// const readline = require('readline');
// const User = require('./models/User'); // Path check kar lena agar models folder kahin aur hai
// require('dotenv').config();

// // Terminal pe aapse Yes/No poochhne ke liye setup
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// const resetCommunity = async () => {
//     try {
//         // MongoDB se connect karein (.env se string lega)
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log("✅ MongoDB Connected...\n");

//         // 1. Un users ko dhundo jo Inactive hain aur unki community 0 se zyada hai
//         const inactiveUsers = await User.find({ 
//             isToppedUp: false, 
//             globalTeamCount: { $gt: 0 } 
//         }).select('userId name globalTeamCount');
        
//         if (inactiveUsers.length === 0) {
//             console.log("🎉 Ek bhi aisa Inactive user nahi mila jiska My Community 0 se zyada ho.");
//             process.exit(0);
//         }

//         // 2. Details dikhao
//         console.log(`⚠️ Total ${inactiveUsers.length} Inactive Users mile hain jinki Community 0 karni hai:\n`);
        
//         // Terminal na bhare isliye shuru ke 15 users dikhayenge
//         inactiveUsers.slice(0, 15).forEach(u => {
//             console.log(`   👉 ID: ${u.userId} | Name: ${u.name} | Current Community: ${u.globalTeamCount}`);
//         });
        
//         if (inactiveUsers.length > 15) {
//             console.log(`   ... aur ${inactiveUsers.length - 15} baaki users hain.`);
//         }

//         console.log("\n========================================================");
        
//         // 3. User se confirmation lo
//         rl.question('Kiya aap sach me in sabhi Inactive users ki "My Community" 0 karna chahte hain? Type (YES / NO): ', async (answer) => {
//             if (answer.trim().toUpperCase() === 'YES') {
//                 console.log("\n⏳ Updating database, please wait...");
                
//                 // 4. Update command (Sirf Inactive walo ko target karega)
//                 const result = await User.updateMany(
//                     { isToppedUp: false, globalTeamCount: { $gt: 0 } },
//                     { $set: { globalTeamCount: 0 } }
//                 );

//                 console.log(`✅ SUCCESS: ${result.modifiedCount} Inactive users ki My Community 0 kar di gayi hai!`);
//                 console.log("🛡️ Active (Topup) users ko bilkul touch nahi kiya gaya hai.");
//             } else {
//                 console.log("\n❌ Operation Cancelled. Kisi bhi user ka data change nahi hua hai.");
//             }
            
//             rl.close();
//             process.exit(0);
//         });

//     } catch (error) {
//         console.error("❌ Error encountered:", error);
//         process.exit(1);
//     }
// };

// resetCommunity();