const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Aapke User model ka sahi path daal dena
const User = require('./models/User'); 

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/your_database_name"; 

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function previewAndDeleteTree() {
    try {
        await mongoose.connect(MONGO_URI);
        
        // Jiske neeche ka tree udana hai aur jisko khud udana hai
       // const targetId = "6013987"; // Agar MongoDB me yeh number hai toh quotes hata dena: 6013987
        const targetId = "6013987"; // Agar MongoDB me yeh number hai toh quotes hata dena: 6013987
        
        console.log(`\n======================================================`);
        console.log(`🔍 STRUCTURE SCANNER FOR ID: ${targetId} `);
        console.log(`======================================================\n`);
        
        // 1. Pehle check karo ki yeh main ID exist karti hai ya nahi
        const targetUser = await User.findOne({ userId: targetId });
        if (!targetUser) {
            console.log(`❌ ERROR: Main ID ${targetId} database mein nahi mili.`);
            process.exit(0);
        }

        let allDownlineIds = [];
        let currentSponsors = [targetId];
        let level = 1;
        let treePreview = [];

        console.log("⏳ Scanning network tree... Please wait...\n");

        // 2. Loop chala kar poori chain nikalna
        // ⚠️ DHYAN DEIN: Agar DB mein sponsor ke liye 'referralId' use hota hai toh usko 'sponsorId' ki jagah likhein
        while (currentSponsors.length > 0) {
            const foundUsers = await User.find({ sponsorId: { $in: currentSponsors } }, 'userId');
            
            if (foundUsers.length === 0) break;

            const nextLevelIds = foundUsers.map(u => u.userId);
            allDownlineIds = allDownlineIds.concat(nextLevelIds);
            
            // Preview ke liye save kar rahe hain ki kis level par kitne log mile
            treePreview.push(`👉 Level ${level}: ${nextLevelIds.length} log`);
            
            currentSponsors = nextLevelIds; 
            level++;
        }

        // 3. Preview Dikhana
        console.log(`📊 --- TREE PREVIEW --- 📊`);
        console.log(`Main ID: ${targetId}`);
        
        if (allDownlineIds.length > 0) {
            console.log(`Iske neeche ka structure:` + `\n` + treePreview.join('\n'));
            console.log(`-----------------------------------`);
            console.log(`Total Downline Members: ${allDownlineIds.length}`);
        } else {
            console.log(`Iske neeche koi structure nahi hai (0 log).`);
        }

        // Total delete kitna hoga (Main ID + Downline)
        const allIdsToDelete = [targetId, ...allDownlineIds];
        
        console.log(`\n⚠️  WARNING: Total ${allIdsToDelete.length} IDs delete hone wali hain (Main ID + Uski poori team)!`);
        
        // 4. Confirmation lena
        rl.question(`\n❓ Kya aap sach mein in ${allIdsToDelete.length} users ko Financial Saarthi se HAMESHA ke liye DELETE karna chahte hain? (yes / no): `, async (answer) => {
            
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                console.log(`\n🗑️  DELETING TREE... PLEASE WAIT...\n`);
                
                // Sabko delete kar rahe hain ek sath
                const result = await User.deleteMany({ userId: { $in: allIdsToDelete } });
                
                console.log(`✅ SUCCESS: ${result.deletedCount} users database se delete ho gaye hain!`);
            } else {
                console.log(`\n❌ Action Cancelled. Koi bhi ID delete nahi hui. Safe hai.`);
            }

            rl.close();
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ ERROR:", error);
        process.exit(1);
    }
}

previewAndDeleteTree();