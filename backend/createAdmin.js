const mongoose = require("mongoose");
const Admin = require("./models/Admin"); 
const crypto = require("crypto"); 
require("dotenv").config(); // .env file load karne ke liye

// Check agar .env me data nahi hai to error de do
if (!process.env.SETUP_ADMIN_ID || !process.env.SETUP_ADMIN_PASS) {
    console.error("❌ Error: .env file me SETUP_ADMIN_ID aur SETUP_ADMIN_PASS set nahi hai!");
    process.exit(1);
}

// 🔥 NAYA CODE: Extra options hata diye hain kyunki Mongoose ka naya version khud sab handle kar leta hai
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

async function resetAndCreateSecureAdmin() {
  const plainAdminId = process.env.SETUP_ADMIN_ID; // .env se uthaya
  const plainPassword = process.env.SETUP_ADMIN_PASS; // .env se uthaya

  try {
    await Admin.deleteMany({});
    console.log("🗑️  Purana data saaf.");

    // ID Hashing
    const hashedAdminId = crypto.createHash("sha256").update(plainAdminId).digest("hex");

    const admin = new Admin({ 
        adminId: hashedAdminId,  
        password: plainPassword, 
        role: "admin"
    });

    await admin.save();

    console.log(`✅ Admin Created Successfully!`);
    console.log(`⚠️  Ab turant .env se ID/Pass hata do aur is file ko delete kar do.`);
    
    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

resetAndCreateSecureAdmin();