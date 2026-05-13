const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔥 NEW FIX: Check karo ki role sach mein "admin" hai
    if (decoded.role !== "admin") {
      console.log("❌ Blocked: A Normal User token tried to access Admin route!");
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = verifyAdmin;