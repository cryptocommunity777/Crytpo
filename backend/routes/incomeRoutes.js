const express = require('express');
const router = express.Router();
const { getIncomeSummary } = require('../controllers/incomeController');
const auth = require('../middleware/authMiddleware');

router.get('/summary', auth, getIncomeSummary);

module.exports = router;
