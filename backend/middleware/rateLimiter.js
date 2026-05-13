// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

module.exports = adminLoginLimiter;
