const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'admin',
  },
});

// 🔥 FIX: Removed 'next' completely. Pure async/await is the modern Mongoose way!
adminSchema.pre('save', async function() {
  if (!this.isModified('password')) return; // Agar password change nahi hua, toh yahin se wapas
  this.password = await bcrypt.hash(this.password, 10);
});

// Helper to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);