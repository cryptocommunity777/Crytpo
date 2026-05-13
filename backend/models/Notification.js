const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: String,
    message: String,
    type: {
      type: String,
      enum: ['update', 'offer', 'notice'],
      default: 'update',
    },
    target: {
      type: String,
      enum: ['all', 'newUsers', 'offerUsers'],
      default: 'all',
    },
    readBy: {  // 🔔 Add this field
      type: [String], // array of userIds
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
