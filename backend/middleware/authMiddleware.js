const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    //console.log('🔥 Auth Header:', authHeader);

    const token = authHeader?.split(' ')[1];
    //console.log('🔥 JWT Token:', token);

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   //console.log('🔥 Decoded Token:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      role: user.role,
      transactionPassword: user.transactionPassword,
    };

    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
