const express = require('express');
const router = express.Router();

// Controller import
const { getDepositAddress } = require('../controllers/depositController');

// 🔥 FIXED: Aapke project ke naming convention ke hisab se import
const authMiddleware = require('../middleware/authMiddleware'); 

// GET Route
router.get('/get-address', authMiddleware, getDepositAddress);

module.exports = router;