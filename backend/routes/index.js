const express = require('express');
const router = express.Router();


router.use('/setting', require('./setting')); // 👈 TOP pe le aao

// 🔐 Auth routes
router.use('/auth', require('./auth'));

 
// 👤 User routes
router.use('/user', require('./user'));

// 🔐 Admin Auth (login check etc.)
router.use('/admin', require('./adminAuth'));

// 🔥 IMPORTANT: Manual Transaction (ADMIN SPECIAL)
// 👉 YE LINE ADD KARNI HAI (admin se pehle)
router.use('/admin', require('./adminManualTransaction'));

// 👇 Generic admin routes (hamesha LAST me)
router.use('/admin', require('./admin'));

// 📢 Notifications
router.use('/admin/notifications', require('./adminNotification'));

// 🔗 Other modules
router.use('/referral', require('./referral'));
router.use('/transaction', require('./transaction'));
 router.use('/wallet', require('./wallet'));
router.use('/income', require('./incomeRoutes'));

router.use('/deposit', require('./depositRoutes'));

router.use('/packages', require('./packages'));
 router.use('/support', require('./support'));
router.use('/dashboard', require('./dashboard'));

router.use('/transactions', require('./systemtransactions')); // 👈 YE LINE ADD KAREIN (Notice the 's')
// 🌐 Root test
router.get('/', (req, res) => {
  res.send('API is running');
});

module.exports = router;
