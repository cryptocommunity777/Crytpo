// const mongoose = require('mongoose');
// const User = require('./models/User'); // Apne User model ka sahi path daalein

// // Yahan apna local MongoDB ka URL daalein
// mongoose.connect('mongodb://127.0.0.1:27017/autopool');

// const seedDeepTeam = async () => {
//   try {
//     const rootUserId = 6614337; // Aapki target ID

//     console.log(`⏳ Checking ID ${rootUserId}...`);
//     let rootUser = await User.findOne({ userId: rootUserId });
    
//     // Agar ye ID database mein nahi hai, toh pehle isko banayenge
//     if (!rootUser) {
//       console.log(`ID ${rootUserId} nahi mili. Nayi ID bana raha hoon...`);
//       rootUser = await User.create({
//         userId: rootUserId,
//         name: "Main Leader (Target)",
//         mobile: "9999911111",
//         email: "target@test.com",
//         country: "India",
//         password: "hashedpassword",
//         transactionPassword: "hashedpassword",
//         sponsorId: null, // Ye sabse upar hai
//         topUpAmount: 120
//       });
//     }

//     console.log(`⏳ Generating 5000 fake users in a DEEP chain (20-40 levels)...`);
    
//     const fakeUsers = [];
    
//     // Yeh array track karega ki kis user ke niche jagah khali hai
//     const availableSponsors = [rootUserId]; 
    
//     // Track karenge kis user ke kitne direct (frontline) lag chuke hain
//     const directsCount = { [rootUserId]: 0 }; 

//     for (let i = 1; i <= 5000; i++) {
//       // 1. Ek random sponsor uthao jiske niche jagah khali ho
//       const randomSponsorIndex = Math.floor(Math.random() * availableSponsors.length);
//       const sponsorId = availableSponsors[randomSponsorIndex];

//       // 2. Us sponsor ka counter +1 kar do
//       directsCount[sponsorId] = (directsCount[sponsorId] || 0) + 1;

//       // 3. Agar is sponsor ke 3 direct (frontline) pure ho gaye, toh isko list se hata do 
//       // (Taaki naye log aur deep levels mein jayein)
//       if (directsCount[sponsorId] >= 3) {
//         availableSponsors.splice(randomSponsorIndex, 1);
//       }

//       const newUserId = 1000000 + i; // Fake Unique IDs start from 1000001
      
//       fakeUsers.push({
//         userId: newUserId,
//         name: `Deep Member ${i}`,
//         mobile: `77${String(i).padStart(8, '0')}`,
//         email: `deepuser${i}@test.com`,
//         country: "India",
//         password: "hashedpassword",
//         transactionPassword: "hashedpassword",
//         sponsorId: sponsorId, // Chain system starts here
//         topUpAmount: Math.random() > 0.4 ? 60 : 0 // 60% chance of paid user
//       });

//       // 4. Naye user ko bhi available sponsor ki list mein daal do taaki iske niche bhi log lag sakein
//       availableSponsors.push(newUserId);
//       directsCount[newUserId] = 0;
//     }

//     // Ek sath database mein daal do (Bohat fast hoga)
//     await User.insertMany(fakeUsers);
    
//     console.log("✅ BOOM! 5000 Users successfully placed under ID 6614337!");
//     console.log("👉 Ab apne Dashboard pe jao, aur ID 6614337 se All Team khol kar jaadu dekho!");
    
//     process.exit();
//   } catch (error) {
//     console.error("Error:", error);
//     process.exit(1);
//   }
// };

// seedDeepTeam();