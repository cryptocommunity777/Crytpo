// C:\Users\HP\Desktop\Cryptocommunity\backend\routes\community.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FakeUser = require('../models/FakeUser'); 

router.get('/global-list', async (req, res) => {
    try {
        // 1. ✅ UPDATE: Real Users wahi nikalenge jo Active hain, aur sort topUpDate (ya updatedAt) se karenge
        const realUsers = await User.find({ isToppedUp: true }) 
            .select('userId name country topUpDate createdAt topUpAmount isToppedUp updatedAt')
            .sort({ updatedAt: -1 }) // Taki Top-up karte hi sabse upar aa jaye
            .limit(100);

        const formattedReal = realUsers.map(u => ({
            userId: u.userId,
            name: u.name,
            country: u.country || 'IN', 
            // Registration date nahi, balki update/top-up ki date dikhayenge
            date: u.topUpDate || u.updatedAt || u.createdAt, 
            amount: u.topUpAmount || 30,
            isActive: true,
            type: 'real'
        }));

        // 2. Fake Users
        const fakeUsers = await FakeUser.find()
            .sort({ date: -1 })
            .limit(100);

        const formattedFake = fakeUsers.map(u => ({
            userId: u.userId,
            name: u.name,
            country: u.country,
            date: u.date,
            amount: u.topUpAmount || 30, 
            isActive: true, 
            type: 'fake'
        }));

        // 3. Dono ko mila kar Time ke hisaab se sort karo
        const combinedList = [...formattedReal, ...formattedFake]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 100); 

        res.json({ success: true, data: combinedList });

    } catch (error) {
        console.error("Global List Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;