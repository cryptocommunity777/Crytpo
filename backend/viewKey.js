// viewKey.js
const { HDNodeWallet } = require("ethers");
require("dotenv").config();

// 1. Apna Mnemonic aur wo User ID yahan daalein jiska address check karna hai
const MNEMONIC = process.env.MNEMONIC; 
const TARGET_USER_ID = "69d6dea783eaa6fc357975f2"; // Example: "6584abcd..."

async function showKey() {
    try {
        if (!MNEMONIC) throw new Error("Mnemonic not found in .env");

        // 2. Wahi index nikalna jo controller use karta hai
        const pathIndex = parseInt(TARGET_USER_ID.toString().substring(0, 8), 16); 
        
        // 3. Master node se derive karna
        const masterNode = HDNodeWallet.fromPhrase(MNEMONIC);
        const userWallet = masterNode.derivePath(`44'/60'/0'/0/${pathIndex}`);

        console.log("-----------------------------------------");
        console.log("📊 USER ID      : ", TARGET_USER_ID);
        console.log("🏦 ADDRESS      : ", userWallet.address);
        console.log("🔑 PRIVATE KEY  : ", userWallet.privateKey);
        console.log("-----------------------------------------");
        console.log("⚠️ WARNING: Is key ko kisi ko mat dena!");

    } catch (error) {
        console.error("Error:", error.message);
    }
}

showKey();

