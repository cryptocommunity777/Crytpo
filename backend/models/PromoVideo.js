const mongoose = require('mongoose');

const promoVideoSchema = new mongoose.Schema({
  youtubeUrl: {
    type: String,
    required: true,
    default: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Default video agar admin ne kuch nahi dala
  }
}, { timestamps: true });

module.exports = mongoose.model('PromoVideo', promoVideoSchema);