require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// 📦 Imports
const allRoutes = require('./routes'); 
const startSweeper = require('./cron/sweepJob');
const { startCron } = require('./roiCron');

// 🔥 1. USER MODEL UNCOMMENT KAR DIYA HAI (Agar aapka file naam alag hai, toh './models/User' ko theek kar lena)
const User = require('./models/User'); 
const startGlobalGrowthCron = require('./cron/autoGlobalGrowth');
const runDailyLeaderClosing = require('./cron/dailyClosing');

const app = express();
app.set('trust proxy', true);

// ====================== 1. CORS SETUP ======================
const allowedOrigins = [
  // --- Local Testing ke liye ---
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://good.localhost:3000',
  'http://localhost:5000',       
  'http://127.0.0.1:5000',
  'http://localhost:5173',       
  'http://127.0.0.1:5173',
  'http://good.localhost:5173', 

  // --- LIVE SERVER KE LIYE (Ye sabse zaroori hain) ---
  'https://cryptocommunity.live',        // 🔥 Live Main Website
  'https://www.cryptocommunity.live',    // 🔥 Live Main Website (www wali)
  'https://good.cryptocommunity.live'   // 🔥 Live Admin Panel (good.localhost ki jagah)
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// ====================== 2. API ROUTES ======================
app.use('/api', allRoutes);

// ====================== 3. MAGIC ROUTE: CREATE ROOT ID ======================
// ====================== 3. MAGIC ROUTE: CREATE ROOT ID ======================
// ====================== 3. MAGIC ROUTE: CREATE ROOT ID ======================
app.get('/setup-root', async (req, res) => {
  try {
    const rootId = 100000; // 🔥 NAYI NUMERIC ROOT ID

    const rootExists = await User.findOne({ userId: rootId });
    if (rootExists) {
      return res.send(`<h1>Root ID already exists! ID: ${rootId}</h1>`);
    }

    const rootUser = new User({
      userId: rootId, 
      name: 'Global Founder',
      mobile: '9999999999',
      email: 'admin@cryptocomm.com',
      password: 'adminpassword123', 
      transactionPassword: 'adminpassword123', // 🔥 YE MISSING THA! Isko add kar diya 🔥
      sponsorId: "0", 
      country: 'Global',
      isActive: true
    });

    await rootUser.save(); 
    return res.send(`<h1>🎉 ROOT ID CREATED SUCCESSFULLY! ID: ${rootId} <br> Ab MongoDB Compass refresh karo!</h1>`);
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating root ID: " + err.message);
  }
});



// ====================== 4. API 404 HANDLER ======================
// 🔥 3. SERVER CRASH WALA ERROR HATA DIYA HAI 🔥
app.use('/api', (req, res) => {
  res.status(404).json({ message: "API Route Not Found!" });
});


// ====================== 5. FRONTEND SERVING ======================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running locally... Use React Dev Server for UI.');
  });
}

// ====================== 6. DATABASE & SERVER ======================
mongoose.connect(process.env.MONGO_URI) 
  .then(async () => { 
    console.log('✅ MongoDB connected successfully!'); 

    try {
      // Baaki cron jobs (agar hain)
      if(typeof startSweeper === 'function') startSweeper(); 
      if(typeof startCron === 'function') await startCron(); 

      // 🔥 YAHAN APNA NAYA GLOBAL GROWTH CRON START KAREIN 🔥
      startGlobalGrowthCron();
      console.log('✅ Global Auto-Growth Cron Started (1 ID every 14 mins)');

     

      // 👇👇👇 NAYA FAST TRACK CRON YAHAN ADD KIYA HAI 👇👇👇
      require('./cron/fastTrackCron'); 
      console.log('✅ Fast Track Offer Daily Cron Started (Runs at 12:05 AM)');
      // 👆👆👆 ========================================= 👆👆👆

    } catch (error) {
      console.error('⚠️ Error starting Cron Jobs:', error);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });