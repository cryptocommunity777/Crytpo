// C:\Users\HP\Desktop\Cryptocommunity\backend\seed100.js
const mongoose = require('mongoose');
const FakeUser = require('./models/FakeUser');
const { countryNames, countriesProbability } = require('./utils/fakeData');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptocommunity");
        console.log("🔗 Connected! Clearing old records and generating 100 Fresh Users...");

        // 1. Purane saare fake users ekdum saaf karo
        await FakeUser.deleteMany({});
        
        let fakeUsersList = [];
        let now = new Date();
        let usedIds = new Set();

        for (let i = 0; i < 100; i++) {
            // ✅ SAFETY FIX: Sahi probability ke hisaab se country code uthao
            const randomCountry = countriesProbability[Math.floor(Math.random() * countriesProbability.length)] || "IN";
            
            // ✅ SAFETY FIX: Usi country ka sahi name pool uthao (Nahi mila toh 'IN' use hoga)
            const namePool = countryNames[randomCountry] || countryNames["IN"];
            
            // ✅ CRASH PREVENTION: Pool me se ek random name nikalo
            const randomName = namePool[Math.floor(Math.random() * namePool.length)];

            // Unique 7-Digit ID generator
            let randomId;
            do {
                randomId = Math.floor(1000000 + Math.random() * 9000000); 
            } while (usedIds.has(randomId));
            usedIds.add(randomId);

            // Time Gap (Har user ke beech 18 mins ka gap taaki UI me descending order mast dikhe)
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

        // 2. Database mein fresh 100 users bulk insert karo
        await FakeUser.insertMany(fakeUsersList);
        console.log(`✅ SUCCESS: 100 Country-Matched Users added successfully!`);
        console.log(`🎉 Sample Latest User: ${fakeUsersList[0].name} from ${fakeUsersList[0].country}`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Seed Error:", err);
        process.exit(1);
    }
};

seedUsers();