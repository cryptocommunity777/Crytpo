// C:\Users\HP\Desktop\Cryptocommunity\backend\resetSystem.js
const mongoose = require('mongoose');
const User = require('./models/User'); // Model ka path check kar lena agar alag ho
require('dotenv').config(); // Aapki DB URI uthane ke liye

const resetInactiveUsersData = async () => {
    try {
        console.log("🚀 Connecting to Database...");
        
        // Mongo URI connect karein (Agar .env me nahi hai to yahan string daal sakte ho)
        const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/cryptocommunity";
        await mongoose.connect(dbUri);

        console.log("🔗 Connected! Starting cleanup...");

        // 🔥 LOGIC: Inactive users ka data reset
        const result = await User.updateMany(
            { isToppedUp: false }, 
            { 
                $set: { 
                    globalTeamCount: 0, 
                    poolIncome: 0, 
                    activePools: [] 
                } 
            }
        );

        console.log("------------------------------------------");
        console.log(`✅ CLEANUP SUCCESSFUL!`);
        console.log(`👤 Inactive Users Fixed: ${result.modifiedCount}`);
        console.log(`📝 Changes: Team count, Pool income, and Active pools set to 0.`);
        console.log("------------------------------------------");

    } catch (error) {
        console.error("❌ Error during reset:", error.message);
    } finally {
        // Connection band karein
        await mongoose.connection.close();
        console.log("🔌 Database connection closed.");
        process.exit();
    }
};

resetInactiveUsersData();