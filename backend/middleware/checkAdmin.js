const jwt = require('jsonwebtoken');

const checkAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("🔐 Incoming Authorization Header:", authHeader);

  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.log("❌ No token found in request headers.");
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);

    if (decoded.role !== 'admin') {
      console.log("❌ Decoded token is not admin:", decoded.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    req.admin = decoded;
    console.log("✅ Admin authenticated:", req.admin);
    next();
  } catch (err) {
    console.log("❌ Invalid token:", err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = checkAdmin;
