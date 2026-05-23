const express = require('express');
const router = express.Router();
// 👇 YE LINE FIX HO GAYI HAI
const verifyAdmin = require('../middleware/adminAuth'); 
const Transaction = require('../models/Transaction'); 
const User = require('../models/User'); 

// 1. FAST TRACK INCOME REPORT
router.get('/fast-track-report', verifyAdmin, async (req, res) => {
    try {
        const { search } = req.query;

        // Sirf 'fast_track' (ya jo naam aapke DB mein hai) type transactions nikalo
        const filter = { type: 'fast_track' }; 

        let transactions = await Transaction.find(filter).sort({ createdAt: -1 }).lean();

        const userIds = [...new Set(transactions.map(tx => tx.userId))];
        const fromUserIds = [...new Set(transactions.map(tx => tx.fromUserId).filter(id => id))];
        const allRelevantIds = [...new Set([...userIds, ...fromUserIds])];

        const users = await User.find(
            { userId: { $in: allRelevantIds } },
            { userId: 1, name: 1, role: 1 }
        ).lean();

        const userMap = Object.fromEntries(users.map(u => [u.userId, u]));

        let formatted = transactions.map(tx => ({
            _id: tx._id,
            receiverId: tx.userId,
            receiverName: userMap[tx.userId]?.name || "-",
            receiverRole: userMap[tx.userId]?.role || "-",
            amount: tx.amount,
            senderId: tx.fromUserId || "-",
            senderName: userMap[tx.fromUserId]?.name || "System",
            description: tx.description || "-",
            date: tx.createdAt
        }));

        if (search) {
            const lower = search.toLowerCase();
            formatted = formatted.filter(
                tx =>
                    tx.receiverId?.toString().includes(lower) ||
                    tx.receiverName?.toLowerCase().includes(lower) ||
                    tx.senderId?.toString().includes(lower) ||
                    tx.senderName?.toLowerCase().includes(lower)
            );
        }

        res.json({ success: true, data: formatted });

    } catch (error) {
        console.error("Fast Track Report Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching fast track report." });
    }
});

// 2. USER FUND OVERVIEW REPORT (All in one line)
// 2. USER FUND OVERVIEW REPORT (All in one line)
// 2. USER FUND OVERVIEW REPORT (All in one line - Fully Fixed)
// 2. USER FUND OVERVIEW REPORT (Total Earned + Available)
router.get('/user-fund-overview', verifyAdmin, async (req, res) => {
    try {
        const { search } = req.query;

        // User data fetch with ALL total & available fields
        const users = await User.find({}, {
            userId: 1, name: 1, email: 1, walletBalance: 1,
            directIncome: 1, totalDirectIncome: 1,
            levelIncome: 1, totalLevelIncome: 1,
            poolIncome: 1, totalPoolIncome: 1,
            rewardIncome: 1, totalRewardIncome: 1,
            topUpAmount: 1, totalWithdrawn: 1, createdAt: 1
        }).lean();

        // Helper function to safely parse Decimal128 from Aggregation
        const parseDecimal = (val) => val ? parseFloat(val.toString()) : 0;

        // 1. Withdrawals Aggregation
        const withdrawalStats = await Transaction.aggregate([
            { $match: { type: "withdrawal", status: { $in: ["success", "completed", "pending"] } } },
            { $group: { _id: "$userId", totalWithdrawn: { $sum: "$amount" } } }
        ]);

        // 2. Deposits & Manual Credits Aggregation
        const depositStats = await Transaction.aggregate([
            { $match: { type: { $in: ["deposit", "manual_credit"] }, status: { $in: ["success", "completed"] } } }, 
            { $group: { _id: "$userId", totalDeposited: { $sum: "$amount" } } }
        ]);

        // 3. Manual Debits
        const manualDebitStats = await Transaction.aggregate([
            { $match: { type: "manual_debit", status: "completed" } },
            { $group: { _id: "$userId", totalManualDebit: { $sum: "$amount" } } }
        ]);

        const withdrawMap = Object.fromEntries(withdrawalStats.map(w => [w._id, parseDecimal(w.totalWithdrawn)]));
        const depositMap = Object.fromEntries(depositStats.map(d => [d._id, parseDecimal(d.totalDeposited)]));
        const manualDebitMap = Object.fromEntries(manualDebitStats.map(d => [d._id, parseDecimal(d.totalManualDebit)]));

        let formatted = users.map(u => {
            const actualWithdrawn = (u.totalWithdrawn > 0) ? u.totalWithdrawn : (withdrawMap[u.userId] || 0);
            const netDeposits = (depositMap[u.userId] || 0) - (manualDebitMap[u.userId] || 0);

            return {
                userId: u.userId,
                name: u.name || "-",
                joinDate: u.createdAt,
                currentWallet: u.walletBalance || 0,
                
                // 💰 DIRECT INCOME
                directAvailable: u.directIncome || 0,
                totalDirectEarned: u.totalDirectIncome || 0,
                
                // 💰 LEVEL INCOME
                levelAvailable: u.levelIncome || 0,
                totalLevelEarned: u.totalLevelIncome || 0,
                
                // 💰 POOL INCOME
                poolAvailable: u.poolIncome || 0,
                totalPoolEarned: u.totalPoolIncome || 0,
                
                // 💰 REWARD INCOME
                rewardAvailable: u.rewardIncome || 0,
                totalRewardEarned: u.totalRewardIncome || 0,
                
                totalDeposited: netDeposits > 0 ? netDeposits : 0,
                totalWithdrawn: actualWithdrawn,
                nodeActiveAmount: u.topUpAmount || 0 
            };
        });

        if (search) {
            const lower = search.toLowerCase();
            formatted = formatted.filter(
                u => u.userId?.toString().includes(lower) || u.name?.toLowerCase().includes(lower)
            );
        }

        res.json({ success: true, data: formatted });

    } catch (error) {
        console.error("User Fund Overview Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching user fund overview." });
    }
});

module.exports = router;