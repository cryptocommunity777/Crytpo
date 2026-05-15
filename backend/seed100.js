// C:\Users\HP\Desktop\Cryptocommunity\backend\seed100.js
const mongoose = require('mongoose');
const FakeUser = require('./models/FakeUser');
const { countryNames, countriesProbability } = require('./utils/fakeData');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptocommunity");
        console.log("🔗 Connected! Generating 100 Proper Matched Users...");

        // 1. Purane users saaf karo
        await FakeUser.deleteMany({});
        
        let fakeUsersList = [];
        let now = new Date();
        let usedIds = new Set();

        for (let i = 0; i < 100; i++) {
            // ✅ SAFETY FIX: Pick Country Code
            const randomCountry = countriesProbability[Math.floor(Math.random() * countriesProbability.length)] || "IN";
            
            // ✅ SAFETY FIX: Get Name Pool (If country missing, fallback to IN)
            const namePool = countryNames[randomCountry] || countryNames["IN"];
            
            // ✅ CRASH PREVENTION: Pick random name from the pool
            const randomName = namePool[Math.floor(Math.random() * namePool.length)];

            // Unique 7-Digit ID
            let randomId;
            do {
                randomId = Math.floor(1000000 + Math.random() * 9000000); 
            } while (usedIds.has(randomId));
            usedIds.add(randomId);

            // Time Gap (approx 18 mins)
            let pastDate = new Date(now.getTime() - (i * 18 * 60000)); 

            fakeUsersList.push({
                userId: randomId, 
                name: randomName, 
                country: randomCountry,
                isToppedUp: true,
                topUpAmount: 30,
                date: pastDate
            });
        }

        // 2. Database mein save karo
        await FakeUser.insertMany(fakeUsersList);
        console.log("✅ SUCCESS: 100 Country-Matched Users added successfully!");
        process.exit();

    } catch (err) {
        console.error("❌ Seed Error:", err);
        process.exit(1);
    }
};

seedUsers();