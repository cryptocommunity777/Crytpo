// const express = require('express');
// const router = express.Router();

// // Controller import
// const { getDepositAddress } = require('../controllers/depositController');

// // 🔥 FIXED: Aapke project ke naming convention ke hisab se import
// const authMiddleware = require('../middleware/authMiddleware'); 

// // GET Route
// router.get('/get-address', authMiddleware, getDepositAddress);

// module.exports = router;

const express = require('express');
const router = express.Router();

// Controller import (Naya verifyAndProcessDeposit function yahan add kar diya)
const { getDepositAddress, verifyAndProcessDeposit } = require('../controllers/depositController');

// 🔥 FIXED: Aapke project ke naming convention ke hisab se import
const authMiddleware = require('../middleware/authMiddleware'); 

// GET Route (Purana wala)
router.get('/get-address', authMiddleware, getDepositAddress);

// 🚀 NAYA POST ROUTE: Jab user frontend se "I have Deposited" dabayega tab ye chalega
router.post('/verify-deposit', authMiddleware, verifyAndProcessDeposit);

module.exports = router;