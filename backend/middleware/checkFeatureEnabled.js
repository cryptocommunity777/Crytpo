const Setting = require('../models/Setting');

module.exports = (featureName) => {
  return async (req, res, next) => {
    try {
      const settings = await Setting.findOne();
      if (!settings) return res.status(500).json({ message: 'Settings not found' });

      // ✅ Admin bypass
      if (req.user?.role === 'admin') return next();

      // 🚧 Maintenance check
      if (settings.maintenanceMode) {
        // ✅ Convert whitelist to strings
        const whitelist = (settings.maintenanceWhitelist || []).map(String);
        const userId = req.user?.userId ? String(req.user.userId) : null;

        if (userId && whitelist.includes(userId)) {
          return next(); // whitelisted user allowed
        }

        return res.status(503).json({
          message: 'Site is under maintenance. Please try later.',
        });
      }

      // ❌ Feature OFF
      if (featureName && !settings[featureName]) {
        return res.status(403).json({
          message: `${featureName} is currently disabled in the system`,
        });
      }

      next();
    } catch (err) {
      console.error('checkFeature error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
};
