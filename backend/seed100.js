// C:\Users\HP\Desktop\Cryptocommunity\backend\seed100.js
const mongoose = require('mongoose');
const FakeUser = require('./models/FakeUser');
const { names, countries } = require('./utils/fakeData');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptocommunity");
        console.log("🔗 Connected to DB. Generating 100 Users...");

        // Purane fake users hata do taaki list fresh ban jaye
        await FakeUser.deleteMany({});
        
        let fakeUsersList = [];
        let now = new Date();
        let usedIds = new Set(); // ✅ Aapas me ID clash na ho iske liye

        for (let i = 0; i < 100; i++) {
            // Har user ke beech 15-20 minute ka gap daal rahe hain taaki real lage
            let pastDate = new Date(now.getTime() - (i * 18 * 60000)); 

            // ✅ 7-Digit Unique ID Generator (Cron wala same logic)
            let randomId;
            do {
                randomId = Math.floor(1000000 + Math.random() * 9000000); 
            } while (usedIds.has(randomId)); // Agar same ID dobara aayi to loop fir ghumega
            
            usedIds.add(randomId); // Nayi ID ko list me daal do

            fakeUsersList.push({
                userId: randomId, // ✅ Ekdum Real jaisi 7-digit ID
                name: names[Math.floor(Math.random() * names.length)],
                country: countries[Math.floor(Math.random() * countries.length)],
                isToppedUp: true,
                topUpAmount: 30, // Sabka package $30
                date: pastDate
            });
        }

        await FakeUser.insertMany(fakeUsersList);
        console.log("✅ 100 Active Fake Users with 7-Digit IDs added successfully!");
        process.exit();

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

seedUsers();