const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const verifyAdmin = require('../middleware/adminAuth'); // Admin JWT middleware

// ⚙️ GET Settings (Admin Only)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const setting = await Setting.findOne();
    if (!setting) return res.status(404).json({ message: 'Settings not found' });

    res.json(setting);
  } catch (err) {
    console.error('GET settings error:', err);
    res.status(500).json({ message: 'Settings fetch error' });
  }
});

// ⚙️ GET Public Settings (No Auth)
router.get('/public', async (req, res) => {
  try {
    const setting = await Setting.findOne();

    res.json({
      maintenanceMode: setting?.maintenanceMode || false,
      maintenanceWhitelist: setting?.maintenanceWhitelist || [],
    });
  } catch (err) {
    console.error('GET public settings error:', err);
    res.status(500).json({
      maintenanceMode: false,
      maintenanceWhitelist: [],
      message: 'Failed to fetch public settings',
    });
  }
});

// ⚙️ PUT/Update Settings (Admin Only)
router.put('/', verifyAdmin, async (req, res) => {
  try {
    const updates = req.body;
    let setting = await Setting.findOne();

    if (!setting) {
      setting = await Setting.create({ ...updates, updatedAt: new Date() });
    } else {
      Object.assign(setting, updates);
      setting.updatedAt = new Date();
      await setting.save();
    }

    res.json({ message: 'Settings updated successfully', setting });
  } catch (err) {
    console.error('PUT settings error:', err);
    res.status(500).json({ message: 'Settings update failed' });
  }
});

module.exports = router;
