require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Setting = require('../models/Setting'); 
const sanitizeUser = require('../utils/sanitizeUser');
const sendEmail = require('../utils/sendEmail');
const checkFeature = require('../middleware/checkFeatureEnabled');
const DummyUser = require('../models/DummyUser.js');
const LoginHistory = require('../models/LoginHistory'); 
const IpRule = require('../models/IpRule'); 
const FakeUser = require('../models/FakeUser'); 

// 🚀 NEW: BlockedDevice Model Import
const BlockedDevice = require('../models/BlockedDevice'); 
const { bot } = require('../utils/telegramBot');

const JWT_SECRET = process.env.JWT_SECRET ;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://178.128.20.53';

// 📌 Helper: Get Real IP Address (Smart Version)
const getClientIP = (req) => {
    let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.connection.remoteAddress || '127.0.0.1';
    if (ip.includes('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }
    return ip;
};

// 📌 Generate Unique User ID
const generateUserId = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = Math.floor(1000000 + Math.random() * 9000000);
    const existsInReal = await User.exists({ userId: id });
    const existsInDummy = await DummyUser.exists({ userId: id });
    if (!existsInReal && !existsInDummy) {
      exists = false;
    }
  }
  return id;
};

// ====================== REGISTER ======================
// router.post('/register', checkFeature('allowRegistrations'), async (req, res) => {
//   try {
//     let { name, mobile, email, country, password, sponsorId, deviceId } = req.body;
//     const userIP = getClientIP(req);

//     // 🔥 SECURITY LAYER 0: Remove extra spaces (trim) so bots can't trick the system
//     name = name ? name.trim() : '';
//     mobile = mobile ? mobile.trim() : '';
//     email = email ? email.trim() : '';

//     // 🔥 1. STRICT NAME VALIDATION (Sirf A-Z aur spaces allow karega, max 50 characters)
//     const nameRegex = /^[A-Za-z\s]{3,50}$/;
//     if (!name || !nameRegex.test(name)) {
//         return res.status(400).json({ message: 'Invalid Name. Only alphabets are allowed (No symbols or numbers).' });
//     }

//     // 🔥 2. STRICT MOBILE VALIDATION (Sirf Numbers, 10 se 15 digits)
//     const mobileRegex = /^[0-9]{10,15}$/;
//     if (!mobile || !mobileRegex.test(mobile)) {
//         return res.status(400).json({ message: 'Invalid Mobile Number. Enter 10 to 15 digits only.' });
//     }

//     // 🔥 3. EMAIL CHECK
//     if (!email || !email.toLowerCase().endsWith('@gmail.com')) {
//         return res.status(400).json({ message: 'Registration failed: Only @gmail.com emails are accepted.' });
//     }

//     // 🔥 4. STRICT PASSWORD VALIDATION (Naya Logic - Blocks @123 etc.)
//     if (!password || password.length < 8) {
//         return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
//     }

//     const lowerPass = password.toLowerCase();

//     // Check A: Repeating characters (e.g., 11111111, aaaaaaaa)
//     const isRepeating = /^(.)\1+$/.test(password); 

//     // Check B: Common weak substrings anywhere in the password (Blocks Name@123, etc.)
//     const weakSubstrings = ['@123', '#123', '1234', '9876', 'password', 'qwerty', 'asdf'];
//     const containsWeakPattern = weakSubstrings.some(pattern => lowerPass.includes(pattern));

//     // Check C: Sequential characters for the whole string (like 12345678, abcdefgh)
//     let isAscending = true;
//     let isDescending = true;
//     for (let i = 0; i < password.length - 1; i++) {
//         if (password.charCodeAt(i) + 1 !== password.charCodeAt(i + 1)) isAscending = false;
//         if (password.charCodeAt(i) - 1 !== password.charCodeAt(i + 1)) isDescending = false;
//     }

//     if (isRepeating || isAscending || isDescending || containsWeakPattern) {
//         return res.status(400).json({ 
//             message: 'Weak password detected! Please do not use predictable patterns like @123, 1234, or repeating characters. Choose a unique password.' 
//         });
//     }

//     if (!sponsorId) return res.status(400).json({ message: 'Sponsor ID is compulsory.' });

//     // 🔥 5. SPONSOR CHECK LOGIC (Real and Fake)
//     let actualSponsorId = parseInt(sponsorId);
//     let sponsorExists = await User.findOne({ userId: actualSponsorId });
//     let isFakeSponsor = false;

//     if (!sponsorExists) {
//          sponsorExists = await FakeUser.findOne({ userId: actualSponsorId });
//         if (sponsorExists) {
//             isFakeSponsor = true; // Mark as fake sponsor
//         }
//     }

//     if (!sponsorExists) return res.status(400).json({ message: 'Invalid Sponsor ID.' });

//     if (!isFakeSponsor && sponsorExists.isSponsorDeactivated) {
//         return res.status(403).json({
//           message: 'Policy violation: The provided sponsor link is invalid or deactivated.'
//         });    
//     }

//     // ✨ NAYA LOGIC: Agar Sponsor Fake User hai, toh real user ko seedha 100000 wali ID ke direct me daal do!
//     if (isFakeSponsor) {
//         const SYSTEM_TOP_ID = 100000; // 🔥 Aapki fix ki hui Main Earning ID
        
//         const topUser = await User.findOne({ userId: SYSTEM_TOP_ID }); 
//         if (topUser) {
//             actualSponsorId = topUser.userId; 
//             console.log(`[SYSTEM ATTACH] Fake Sponsor (${sponsorId}) used. Redirecting to Top Earning ID: ${topUser.userId}`);
//         } else {
//             console.log(`⚠️ WARNING: Top ID ${SYSTEM_TOP_ID} not found in database!`);
//         }
//     }

//     // 🛡️ SMART REGISTRATION LIMIT (5 Accounts Per IP + Admin Block)
//     const isLocalIP = userIP === '127.0.0.1' || userIP === '::1';

//     if (!isLocalIP) {
//         const rule = await IpRule.findOne({ ipAddress: userIP });
        
//         if (rule && rule.isBlocked) {
//             return res.status(403).json({ message: "Access Denied: Your IP has been blocked by the Administrator." });
//         }
//     }

//     // 🚀 DEVICE FINGERPRINT CHECK
//     if (deviceId) {
//         const isDeviceBlocked = await BlockedDevice.findOne({ deviceId });
//         if (isDeviceBlocked) {
//             return res.status(403).json({ message: "Access Denied: Your device has been blocked due to a policy violation." });
//         }
//     }

//     // ✨ NAYA LOGIC: 100% Unique ID Check (Real aur Fake dono collection me)
//     let newUserId;
//     let isUniqueId = false;

//     while (!isUniqueId) {
//         newUserId = await generateUserId(); // Temporary ID generate karega
        
//         // Check karega ki ye ID kisibhi table me mojood toh nahi hai
//         const existsInFake = await FakeUser.exists({ userId: newUserId });
//         const existsInReal = await User.exists({ userId: newUserId });

//         // Agar dono jagah nahi hai, tab isko final manega aur loop todega
//         if (!existsInFake && !existsInReal) {
//             isUniqueId = true;
//         }
//     }

//     // Ab naya user exactly 100% unique ID ke sath banega
//     const user = new User({
//       userId: newUserId, 
//       name, mobile, email, country,
//       password, transactionPassword: password,
//       sponsorId: actualSponsorId, // ✅ Yahan updated sponsor ID aayegi (Real ho ya Admin ki)
//       role: 'user',
//       ipAddress: userIP,
//       deviceId: deviceId || null 
//     });

//     await user.save();

//     // 👉 EMAIL TEMPLATE
//     // try {
//     //     await sendEmail({
//     //         email: user.email,
//     //         subject: '🎉 Welcome to Crypto Community!',
//     //         html: `
//     //         <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eaeaea;">
                
//     //             <div style="background-color: #2b4450; padding: 40px 20px; text-align: center; color: #ffffff;">
//     //                 <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚀 Welcome to Crypto Community</h1>
//     //                 <p style="margin: 10px 0 0 0; font-size: 15px; color: #cccccc;">Your journey to financial growth starts here</p>
//     //             </div>
                
//     //             <div style="padding: 40px 30px; color: #333333;">
//     //                 <p style="font-size: 16px; margin-top: 0; margin-bottom: 15px;">Hello <strong>${user.name}</strong>,</p>
                    
//     //                 <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
//     //                     Congratulations! Your account has been successfully created. Get ready to build your global network, unlock exciting <strong>Single Leg rewards</strong>, and track your daily growth with our secure platform. We are thrilled to have you on board! 🌟
//     //                 </p>
//     //                 <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 30px;">
//     //                     Please find your confidential login details below:
//     //                 </p>
                    
//     //                 <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 35px; border-left: 4px solid #1e88e5;">
//     //                     <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
//     //                         <span style="display: inline-block; width: 25px;">👤</span> <strong>User ID:</strong> ${user.userId}
//     //                     </p>
//     //                     <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
//     //                         <span style="display: inline-block; width: 25px;">🔑</span> <strong>Password:</strong> ${user.password}
//     //                     </p>
//     //                     <p style="margin: 0; font-size: 16px; color: #333;">
//     //                         <span style="display: inline-block; width: 25px;">🛡️</span> <strong>Transaction Password:</strong> ${user.transactionPassword}
//     //                     </p>
//     //                 </div>
                    
//     //                 <div style="text-align: center; margin-bottom: 40px;">
//     //                     <a href="https://cryptocommunity.live/login" style="display: inline-block; background-color: #1e88e5; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(30,136,229,0.3);">🔐 Login to Dashboard</a>
//     //                 </div>
                    
//     //                 <p style="font-size: 14px; color: #d32f2f; margin: 0; background-color: #ffebee; padding: 12px; border-radius: 6px;">
//     //                     ⚠️ <strong>Security Alert:</strong> Please do not share your login or transaction passwords with anyone for your account's safety.
//     //                 </p>
//     //             </div>
                
//     //             <div style="background-color: #1a1a1a; padding: 20px; text-align: center; color: #888888; font-size: 13px;">
//     //                 © 2026 Crypto Community. All rights reserved.<br>
//     //                 <span style="font-size: 11px;">This is an automated message, please do not reply to this email.</span>
//     //             </div>
//     //         </div>
//     //         ` 
//     //     });
//     // } catch (emailErr) { 
//     //     console.error("Email failed:", emailErr); 
//     // }

//     res.status(201).json({ message: 'User registered successfully.', userId: user.userId, name: user.name, password: user.password });

//   } catch (err) {
//     console.error('Register error:', err);
//     res.status(500).json({ message: 'Server error.' });
//   }
// });

// 🔥 RANDOM PASSWORD GENERATOR HELPER FUNCTION
const generateRandomPassword = (length = 8) => {
    // Sirf Capital letters hataye hain, small letters aur numbers wahi hain
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let pass = '';
    for (let i = 0; i < length; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
};

router.post('/register', checkFeature('allowRegistrations'), async (req, res) => {
  try {
    // 🔥 Frontend se ab password nahi aayega, sirf ye details aayengi
    let { name, mobile, email, country, sponsorId, deviceId, walletAddress } = req.body;
    const userIP = getClientIP(req);

    // 🔥 SECURITY LAYER 0: Remove extra spaces (trim)
    name = name ? name.trim() : '';
    mobile = mobile ? mobile.trim() : '';
    email = email ? email.trim() : '';
    walletAddress = walletAddress ? walletAddress.trim() : ''; 

    // 🔥 1. STRICT NAME VALIDATION
    const nameRegex = /^[A-Za-z\s]{3,50}$/;
    if (!name || !nameRegex.test(name)) {
        return res.status(400).json({ message: 'Invalid Name. Only alphabets are allowed (No symbols or numbers).' });
    }

    // 🔥 2. STRICT MOBILE VALIDATION
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobile || !mobileRegex.test(mobile)) {
        return res.status(400).json({ message: 'Invalid Mobile Number.' });
    }

    // 🔥 3. EMAIL CHECK
    if (!email || !email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'Registration failed: Only @gmail.com emails are accepted.' });
    }

    // 🔥 4. USDT BEP20 WALLET VALIDATION (Flexible Length)
    if (!walletAddress) {
        return res.status(400).json({ message: 'USDT BEP20 Withdrawal Address is compulsory.' });
    }
    if (!/^0x[a-fA-F0-9]{28,48}$/.test(walletAddress)) {
        return res.status(400).json({ message: 'Invalid USDT BEP20 Address format. It must start with 0x and be valid length.' });
    }

    if (!sponsorId) return res.status(400).json({ message: 'Sponsor ID is compulsory.' });

    // 🔥 5. SPONSOR CHECK LOGIC (Real and Fake)
    let actualSponsorId = parseInt(sponsorId);
    let sponsorExists = await User.findOne({ userId: actualSponsorId });
    let isFakeSponsor = false;

    if (!sponsorExists) {
         sponsorExists = await FakeUser.findOne({ userId: actualSponsorId });
        if (sponsorExists) {
            isFakeSponsor = true; 
        }
    }

    if (!sponsorExists) return res.status(400).json({ message: 'Invalid Sponsor ID.' });

    if (!isFakeSponsor && sponsorExists.isSponsorDeactivated) {
        return res.status(403).json({ message: 'Policy violation: The provided sponsor link is invalid or deactivated.' });    
    }

    // ✨ Fake Sponsor Logic
    if (isFakeSponsor) {
        const SYSTEM_TOP_ID = 100000; 
        const topUser = await User.findOne({ userId: SYSTEM_TOP_ID }); 
        if (topUser) {
            actualSponsorId = topUser.userId; 
            console.log(`[SYSTEM ATTACH] Fake Sponsor (${sponsorId}) used. Redirecting to Top Earning ID: ${topUser.userId}`);
        } else {
            console.log(`⚠️ WARNING: Top ID ${SYSTEM_TOP_ID} not found in database!`);
        }
    }

    // 🛡️ SMART REGISTRATION LIMIT
    const isLocalIP = userIP === '127.0.0.1' || userIP === '::1';
    if (!isLocalIP) {
        const rule = await IpRule.findOne({ ipAddress: userIP });
        if (rule && rule.isBlocked) {
            return res.status(403).json({ message: "Access Denied: Your IP has been blocked by the Administrator." });
        }
    }

    // 🚀 DEVICE FINGERPRINT CHECK
    if (deviceId) {
        const isDeviceBlocked = await BlockedDevice.findOne({ deviceId });
        if (isDeviceBlocked) {
            return res.status(403).json({ message: "Access Denied: Your device has been blocked due to a policy violation." });
        }
    }

    // ✨ Unique ID Generator
    let newUserId;
    let isUniqueId = false;
    while (!isUniqueId) {
        newUserId = await generateUserId(); 
        const existsInFake = await FakeUser.exists({ userId: newUserId });
        const existsInReal = await User.exists({ userId: newUserId });
        if (!existsInFake && !existsInReal) {
            isUniqueId = true;
        }
    }

    // 🔥 AUTO GENERATE PASSWORD
    const generatedPassword = generateRandomPassword(8); // 8 character ka strong mix password

    // User Creation
    const user = new User({
      userId: newUserId, 
      name, mobile, email, country,
      password: generatedPassword, 
      transactionPassword: generatedPassword, // Same password dono ke liye
      sponsorId: actualSponsorId, 
      walletAddress: walletAddress, 
      role: 'user',
      ipAddress: userIP,
      deviceId: deviceId || null 
    });

    await user.save();

    // 👉 EMAIL TEMPLATE (Active)
    try {
        await sendEmail({
            email: user.email,
            subject: '🎉 Welcome to Crypto Community!',
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eaeaea;">
                <div style="background-color: #2b4450; padding: 40px 20px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚀 Welcome to Crypto Community</h1>
                    <p style="margin: 10px 0 0 0; font-size: 15px; color: #cccccc;">Your journey to financial growth starts here</p>
                </div>
                <div style="padding: 40px 30px; color: #333333;">
                    <p style="font-size: 16px; margin-top: 0; margin-bottom: 15px;">Hello <strong>${user.name}</strong>,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
                        Congratulations! Your account has been successfully created. Get ready to build your global network, unlock exciting <strong>Community Earning rewards</strong>, and track your daily growth with our secure platform. We are thrilled to have you on board! 🌟
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 30px;">
                        Please find your confidential login details below:
                    </p>
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 35px; border-left: 4px solid #1e88e5;">
                        <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
                            <span style="display: inline-block; width: 25px;">👤</span> <strong>User ID:</strong> ${user.userId}
                        </p>
                        <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
                            <span style="display: inline-block; width: 25px;">🔑</span> <strong>Login Password:</strong> ${user.password}
                        </p>
                        <p style="margin: 0; font-size: 16px; color: #333;">
                            <span style="display: inline-block; width: 25px;">🛡️</span> <strong>Transaction Password:</strong> ${user.transactionPassword}
                        </p>
                    </div>
                    <div style="text-align: center; margin-bottom: 40px;">
                        <a href="https://cryptocommunity.live/login" style="display: inline-block; background-color: #1e88e5; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(30,136,229,0.3);">🔐 Login to Dashboard</a>
                    </div>
                    <p style="font-size: 14px; color: #d32f2f; margin: 0; background-color: #ffebee; padding: 12px; border-radius: 6px;">
                        ⚠️ <strong>Security Alert:</strong> Please do not share your login or transaction passwords with anyone for your account's safety.
                    </p>
                </div>
                <div style="background-color: #1a1a1a; padding: 20px; text-align: center; color: #888888; font-size: 13px;">
                    © 2026 Crypto Community. All rights reserved.<br>
                    <span style="font-size: 11px;">This is an automated message, please do not reply to this email.</span>
                </div>
            </div>
            ` 
        });
    } catch (emailErr) { 
        console.error("Email failed:", emailErr); 
    }

    res.status(201).json({ 
        message: 'User registered successfully. Password sent to email.', 
        userId: user.userId, 
        name: user.name, 
        password: user.password // Abhi bhi popup ke liye bhej rahe hain
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ====================== LOGIN ======================
router.post('/login', async (req, res) => {
  try {
    const { userId, password, deviceId } = req.body;
    const userIP = getClientIP(req);

    const user = await User.findOne({ userId });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // 🛡️ SMART LOGIN LIMIT (5 Users Per IP + Admin Block)
    if (user.role !== 'admin') {
        const isLocalIP = userIP === '127.0.0.1' || userIP === '::1';

        if (!isLocalIP) {
            const rule = await IpRule.findOne({ ipAddress: userIP });
            
            if (rule && rule.isBlocked) {
                return res.status(403).json({ message: "Access Denied: Your IP has been blocked by the Administrator." });
            }

            // ✅ Login IP Limit Wapas Laga Di (Default 5)
            const allowedLimit = (rule && rule.limit) ? rule.limit : 5;
            const uniqueUsersOnThisIP = await LoginHistory.distinct('userId', { ipAddress: userIP });

            if (uniqueUsersOnThisIP.length >= allowedLimit && !uniqueUsersOnThisIP.includes(user.userId)) {
                return res.status(403).json({ 
                    message: `Access Denied: You have reached the maximum limit of ${allowedLimit} accounts per network.` 
                });
            }
        }
    }

    // 🚀 DEVICE FINGERPRINT CHECK (Login ke time sirf block check)
    if (deviceId) {
        const isDeviceBlocked = await BlockedDevice.findOne({ deviceId });
        if (isDeviceBlocked) {
            return res.status(403).json({ message: "Access Denied: Your device has been blocked due to a policy violation." });        
        }
    }

    console.log(`User Logging In: ${user.email} | IP: ${userIP}`);

    // Maintenance & Security Checks
    const settings = await Setting.findOne();
    if (settings) {
        if (settings.maintenanceMode && user.role !== 'admin') {
            const whitelist = (settings.maintenanceWhitelist || []).map(String);
            if (!whitelist.includes(String(user.userId))) return res.status(503).json({ message: 'Maintenance Mode.' });
        }
        if (!settings.allowLogin && user.role !== 'admin') return res.status(403).json({ message: 'Login is disabled.' });
    }

    if (password.toLowerCase() !== user.password.toLowerCase()) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked.' });

    // ✅ IP Update (Migration)
    user.ipAddress = userIP; 
    
    if (deviceId) {
        user.deviceId = deviceId;
    }
    
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '50m' });

    // ✅ Save History with Real IP
    try {
       await LoginHistory.create({
         userId: user.userId,
         name: user.name,
         mobile: user.mobile,
         ipAddress: userIP 
       });
    } catch (hErr) { console.error('History failed'); }

    res.json({ message: 'Login successful', token, user: sanitizeUser(user) });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ... (Aapke Forgot / Reset password ke routes same rahenge yahan) ...


// ====================== FORGOT PASSWORD ======================
router.post('/forgot-password', checkFeature(), async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // 🕒 RATE LIMITING LOGIC: Din mein sirf 3 Password Reset Emails
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Agar last request aaj se pehle ki hai (kal ki ya purani), toh count 0 kardo (Reset)
    if (!user.lastPasswordResetDate || user.lastPasswordResetDate < startOfToday) {
        user.passwordResetCount = 0; 
    }

    // Limit Check: Agar count 3 ya usse zyada hai, toh error de do
    if (user.passwordResetCount >= 3) {
        return res.status(429).json({ 
            message: "Daily limit exceeded. You can only request a password reset 3 times a day." 
        });
    }

    // 🔐 Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // 📈 Update limit count aur date
    user.passwordResetCount += 1; 
    user.lastPasswordResetDate = now;

    await user.save();

    const resetLink = `https://cryptocommunity.live/reset-password/${resetToken}`;
    
    // 📧 SEND EMAIL
    await sendEmail({
      email: user.email,
      subject: '🔐 Password Reset Request',
      message: `Reset Link: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2E86C1;">Password Reset Request</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your password. Click below:</p>
          <p style="text-align:center;">
            <a href="${resetLink}" style="padding:12px 24px;background:#2E86C1;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
          </p>
          <p>This link expires in 1 hour.</p>
        </div>
      `,
    });

    res.json({ message: '✅ Password reset link sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ====================== RESET PASSWORD ======================
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // ✅ Update password
    user.password = newPassword;
    user.transactionPassword = newPassword;

    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    // ✅ EMAIL SEND (UPDATED)
    try {
      await sendEmail({
        email: user.email,
        subject: '🔐 Password Reset Successful',
        html: `
        <div style="font-family: Arial; padding:20px;">
          <h2>✅ Password Reset Successful</h2>
          <p>Hello <b>${user.name}</b>,</p>

          <p>Your password has been updated successfully.</p>

          <div style="background:#f5f5f5; padding:15px; border-radius:8px;">
            <p><b>User ID:</b> ${user.userId}</p>
            <p><b>Password:</b> ${newPassword}</p>
            <p><b>Transaction Password:</b> ${newPassword}</p>
          </div>

          <br/>
          <a href="https://cryptocommunity.live/login"
          style="background:#1e88e5; color:#fff; padding:12px 25px; text-decoration:none; border-radius:6px;">
          🔐 Login Now
          </a>
        </div>
        `,
      });
    } catch (e) {
      console.log("Email failed:", e.message);
    }

    // ✅ RESPONSE ME DATA BHEJO
    res.json({
      message: 'Password reset successful',
      userId: user.userId,
      password: newPassword,
      transactionPassword: newPassword,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;