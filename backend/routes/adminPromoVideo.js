const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const PromoVideo = require("../models/PromoVideo");

// 🎥 GET: Fetch all videos for Admin
router.get("/list", adminAuth, async (req, res) => {
  try {
    const videos = await PromoVideo.find().sort({ createdAt: -1 });
    res.json({ success: true, videos });
  } catch (err) {
    res.status(500).json({ message: "Error loading videos." });
  }
});

// 🎥 POST: Add a new Promo Video
router.post("/add", adminAuth, async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return res.status(400).json({ message: "YouTube URL is required." });

    const newVideo = new PromoVideo({ youtubeUrl });
    await newVideo.save();

    res.json({ success: true, message: "Video added to the list!", video: newVideo });
  } catch (err) {
    res.status(500).json({ message: "Server error while adding video." });
  }
});

// 🎥 DELETE: Remove a video
router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    await PromoVideo.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Video removed successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting video." });
  }
});

module.exports = router;