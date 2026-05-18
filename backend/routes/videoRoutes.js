const express = require('express');
const router = express.Router();
const PromoVideo = require('../models/PromoVideo');

// @route   GET /api/video/all
// @desc    Get all active promo videos for user dashboard
router.get('/all', async (req, res) => {
  try {
    const videos = await PromoVideo.find().sort({ createdAt: -1 }); 
    res.status(200).json({ success: true, videos });
  } catch (error) {
    console.error("Video fetch error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;