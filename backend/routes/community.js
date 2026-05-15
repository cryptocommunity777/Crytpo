const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FakeUser = require('../models/FakeUser'); 

router.get('/global-list', async (req, res) => {
    try {
        // 1. ✅ REAL USERS: Lean() use kiya hai fast performance ke liye
        const realUsers = await User.find({ isToppedUp: true }) 
            .select('userId name country topUpDate createdAt topUpAmount updatedAt')
            .sort({ topUpDate: -1 }) // Priority top-up date ko di hai
            .limit(100)
            .lean();

        const formattedReal = realUsers.map(u => ({
            userId: u.userId,
            name: u.name,
            country: (u.country || 'IN').toUpperCase(), // Hamesha uppercase (e.g., 'in' -> 'IN')
            // Priority: 1. TopUp Date, 2. CreatedAt
            date: u.topUpDate || u.createdAt, 
            amount: u.topUpAmount || 30,
            isActive: true,
            type: 'real'
        }));

        // 2. ✅ FAKE USERS: Inka date seed script se hi 'pastDate' format me aata hai
        const fakeUsers = await FakeUser.find()
            .sort({ date: -1 })
            .limit(100)
            .lean();

        const formattedFake = fakeUsers.map(u => ({
            userId: u.userId,
            name: u.name,
            country: (u.country || 'IN').toUpperCase(),
            date: u.date,
            amount: u.topUpAmount || 30, 
            isActive: true, 
            type: 'fake'
        }));

        // 3. ✅ COMBINED & FINAL SORT
        // Dono list ko mila kar 'date' ke hisaab se sabse latest upar dikhayenge
        const combinedList = [...formattedReal, ...formattedFake]
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Newest First
            .slice(0, 100); // Top 100 entries only

        res.json({ 
            success: true, 
            count: combinedList.length,
            data: combinedList 
        });

    } catch (error) {
        console.error("🚨 Global List Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;