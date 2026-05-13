require("dotenv").config();
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// 🛡️ ANTI-CRASH SYSTEM
// ==========================================
process.on('uncaughtException', (err) => console.log("⚠️ Uncaught Exception:", err.message));
process.on('unhandledRejection', (reason) => console.log("⚠️ Unhandled Rejection:", reason));

// ==========================================
// 1. DATA STORES & CACHE SYSTEM (File Storage)
// ==========================================
let liveDepositsFeed = [];
let liveWithdrawalsFeed = [];

// Ye file aapke routes folder mein banegi data save rakhne ke liye
const CACHE_FILE = path.join(__dirname, "botFeedCache.txt");

// 📂 Function to Load Old Data on Server Restart
function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const fileData = fs.readFileSync(CACHE_FILE, "utf8");
            const parsedData = JSON.parse(fileData);
            liveDepositsFeed = parsedData.deposits || [];
            liveWithdrawalsFeed = parsedData.withdrawals || [];
            console.log(`💾 Loaded ${liveDepositsFeed.length} Deposits & ${liveWithdrawalsFeed.length} Withdrawals from cache.`);
        }
    } catch (err) {
        console.log("⚠️ Cache Load Error:", err.message);
    }
}

// 💾 Function to Save Data (Called automatically when new tx is added)
function saveCache() {
    try {
        const dataToSave = {
            deposits: liveDepositsFeed,
            withdrawals: liveWithdrawalsFeed
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(dataToSave, null, 2), "utf8");
    } catch (err) {
        console.log("⚠️ Cache Save Error:", err.message);
    }
}

// Start karte hi purana data load karo
loadCache();

let depositQueue = [];
let withdrawalQueue = [];
let processedHashes = new Set();
let listenerStarted = false;

const generateUserId = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==========================================
// 2. WEB3 SETUP (ONLY USDT)
// ==========================================
const RPC = process.env.RPC || "https://bsc-dataseed.binance.org/";
const USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955";
const TARGET_WALLET = "0x08b666399959F8019013CfAd6d5D6E3730860688".toLowerCase(); // Apna wallet
const DECIMALS = 18;

let provider;
let contract;
// Sirf USDT ka transfer event, BNB isme aayega hi nahi
const ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];

console.log("🔥 UsdtBoomers Super-Stable Scanner Started For Website");

// ==========================================
// 3. FILTERS FOR EXACT AMOUNTS (GLOBAL BOT)
// ==========================================
function isValidDeposit(amount) {
    if (![30, 60, 120].includes(amount)) return false;
    if (amount === 30) return true; // Sabse zyada 30 aayega
    if (amount === 60) return Math.random() <= 0.15; // 15% chance
    if (amount === 120) return Math.random() <= 0.02; // 2% chance surprise ke liye
    return false;
}

function isValidWithdrawal(amount) {
    if (![4.5, 6.3, 9, 18, 27, 36, 45].includes(amount)) return false;

    if (amount === 4.5 || amount === 6.3) return true; 
    
    if (amount === 9 || amount === 18) return Math.random() <= 0.60; 
    if (amount === 27) return Math.random() <= 0.20; 
    if (amount === 36) return Math.random() <= 0.10; 
    if (amount === 45) return Math.random() <= 0.05; 

    return false;
}

// ==========================================
// 4. THE WEB3 LISTENER (LIVE ONLY) & AUTO-RECONNECT
// ==========================================
function startListener() {
    if (listenerStarted) return;
    listenerStarted = true;
    
    try {
        provider = new ethers.JsonRpcProvider(RPC);
        contract = new ethers.Contract(USDT_CONTRACT, ABI, provider);
        console.log("🎧 Global BSC Web3 Listener Connected (Live Tracking Only)...");

        contract.on("Transfer", async (from, to, value, event) => {
            try {
                let rawAmount = Number(ethers.formatUnits(value, DECIMALS));
                const amount = Number(rawAmount.toFixed(2));
                const hash = event.log.transactionHash;

                if (processedHashes.has(hash)) return;

                const isTargetIn = to.toLowerCase() === TARGET_WALLET;
                const isTargetOut = from.toLowerCase() === TARGET_WALLET;

                // ==========================================================
                // 🔥 TARGET WALLET INSTANT LOGIC
                // ==========================================================
                if (isTargetIn || isTargetOut) {
                    const instantTx = {
                        fromAddress: from,
                        toAddress: to,
                        amount: amount,
                        hash: hash,
                        status: "Success",
                        createdAt: new Date() // Instant current time
                    };

                    if (isTargetIn) {
                        liveDepositsFeed.unshift(instantTx);
                        if (liveDepositsFeed.length > 500) liveDepositsFeed.pop();
                        console.log("⚡ INSTANT TARGET IN (Deposit): $", amount);
                    } else if (isTargetOut) {
                        instantTx.userId = generateUserId(); 
                        liveWithdrawalsFeed.unshift(instantTx);
                        if (liveWithdrawalsFeed.length > 500) liveWithdrawalsFeed.pop();
                        console.log("⚡ INSTANT TARGET OUT (Withdrawal): $", amount);
                    }

                    processedHashes.add(hash);
                    saveCache(); 
                    return; 
                }

                // ==========================================================
                // 🌀 NORMAL SCANNER BOT (Queue Limit kam kar di hai -> 15)
                // ==========================================================
                if (isValidDeposit(amount) && depositQueue.length < 15) {
                    depositQueue.push({
                        fromAddress: from,
                        toAddress: to,
                        amount: amount,
                        hash: hash,
                        status: "Success",
                        detectedAt: new Date().getTime() // 👈 NAYA: Pakadne ka time note kiya
                    });
                    processedHashes.add(hash);
                }

                if (isValidWithdrawal(amount) && withdrawalQueue.length < 15) {
                    withdrawalQueue.push({
                        userId: generateUserId(),
                        amount: amount,
                        hash: hash,
                        status: "Success",
                        detectedAt: new Date().getTime() // 👈 NAYA: Pakadne ka time note kiya
                    });
                    processedHashes.add(hash);
                }

                if(processedHashes.size > 5000) processedHashes.clear();

            } catch (err) {
                // Ignore scan errors
            }
        });

        provider.on("error", (err) => {
            console.log("⚠ Provider error drop:", err.message);
            restartListener();
        });

    } catch (err) {
        console.log("Connection failed, retrying in 10s...");
        restartListener();
    }
}

function restartListener() {
    listenerStarted = false;
    console.log("🔄 Reconnecting Listener in 10 seconds...");
    setTimeout(() => {
        if(contract) contract.removeAllListeners();
        startListener();
    }, 10000); 
}

// ==========================================
// 5. THE SLOW RELEASE LOOPS & FRESHNESS CHECK
// ==========================================

const getDepositDelay = () => {
    const min = 2 * 60 * 1000;  // 2 Mins
    const max = 10 * 60 * 1000; // 10 Mins
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getWithdrawalDelay = (amount) => {
    if (amount === 4.5 || amount === 6.3) {
        const min = 5 * 60 * 1000; 
        const max = 10 * 60 * 1000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
        const min = 10 * 60 * 1000;
        const max = 15 * 60 * 1000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// ⏳ NAYA: Function check karne ke liye ki Hash kitna purana ho gaya hai
const isTooOld = (detectedAtTime, maxAgeMinutes) => {
    if (!detectedAtTime) return false;
    const now = new Date().getTime();
    return (now - detectedAtTime) > (maxAgeMinutes * 60 * 1000);
};

// Deposits release loop
async function depositSenderLoop() {
    while (true) {
        try {
            if (depositQueue.length === 0) {
                await new Promise(r => setTimeout(r, 10000)); 
                continue;
            }

            const tx = depositQueue.shift();

            // 🔥 FRESHNESS CHECK: Agar BSC par deposit 15 minute se purana hai, toh phek do (skip)
            if (isTooOld(tx.detectedAt, 15)) {
                console.log(`⏳ Skipped STALE Deposit: $${tx.amount} (Hash too old)`);
                continue; // Bina time lagaye agli transaction check karega
            }

            tx.createdAt = new Date(); // Website ko dikhane wala fresh time

            liveDepositsFeed.unshift(tx);
            if (liveDepositsFeed.length > 500) liveDepositsFeed.pop();

            saveCache();
            console.log("🌐 Sent REAL Deposit to Site: $", tx.amount);
            
            await new Promise(r => setTimeout(r, getDepositDelay())); 
        } catch (err) {
            console.log("Deposit Loop Error:", err.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

// Withdrawals release loop
async function withdrawalSenderLoop() {
    while (true) {
        try {
            if (withdrawalQueue.length === 0) {
                await new Promise(r => setTimeout(r, 10000)); 
                continue;
            }

            const tx = withdrawalQueue.shift();

            // 🔥 FRESHNESS CHECK: Withdrawal delay 15 mins tak hai, toh expiry 35 minutes rakhi hai
            if (isTooOld(tx.detectedAt, 25)) {
                console.log(`⏳ Skipped STALE Withdrawal: $${tx.amount} (Hash too old)`);
                continue; 
            }

            tx.createdAt = new Date(); // Website ko dikhane wala fresh time

            liveWithdrawalsFeed.unshift(tx);
            if (liveWithdrawalsFeed.length > 500) liveWithdrawalsFeed.pop();

            saveCache();
            console.log("🌐 Priority Release: $", tx.amount);
            
            await new Promise(r => setTimeout(r, getWithdrawalDelay(tx.amount))); 
        } catch (err) {
            console.log("Loop Error:", err.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

// Start everything
startListener();
depositSenderLoop();
withdrawalSenderLoop();

// ==========================================
// 6. API ROUTES (For React Frontend)
// ==========================================

router.get("/deposits/live-feed", authMiddleware, (req, res) => {
    res.json({ success: true, deposits: liveDepositsFeed });
});

router.get("/deposits/recent", authMiddleware, (req, res) => {
    res.json({ success: true, deposits: liveDepositsFeed.slice(0, 5) });
});

router.get("/withdrawals/all", authMiddleware, (req, res) => {
    res.json({ success: true, withdrawals: liveWithdrawalsFeed });
});

router.get("/withdrawals/recent", authMiddleware, (req, res) => {
    res.json({ success: true, withdrawals: liveWithdrawalsFeed.slice(0, 5) });
});

module.exports = router;