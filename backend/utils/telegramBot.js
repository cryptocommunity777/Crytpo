// const { Telegraf } = require('telegraf');
// const User = require('../models/User');

// // Initialize Bot Instance
// const botToken = process.env.TELEGRAM_BOT_TOKEN;
// const bot = botToken ? new Telegraf(botToken) : null;

// const setupTelegramBot = () => {
//   const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME; // Ensure this is @yourchannel

//   if (!bot) {
//     console.log("❌ CRITICAL: Telegram Bot Token is missing in Environment Variables.");
//     return;
//   }

//   // Handle /start command with Payload (Deep Linking)
// bot.start(async (ctx) => {
//   const userIdFromLink = ctx.startPayload; 
//   const telegramUserId = ctx.from.id;
//   const firstName = ctx.from.first_name || "Member";
//   const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME;

//   // 1. Agar user direct bot par aaya hai
//   if (!userIdFromLink) {
//     return ctx.reply(
//       `👋 Hello ${firstName}!\n\nTo connect your account and start earning, please click the "Verify" button directly from your website dashboard.`
//     );
//   }

//   try {
//     // 🔍 2. SILENT MEMBERSHIP CHECK (Terminal ganda nahi hoga)
//     let isAuthorized = false;
//     try {
//       const memberStatus = await ctx.telegram.getChatMember(channelUsername, telegramUserId);
//       isAuthorized = ['member', 'administrator', 'creator'].includes(memberStatus.status);
//     } catch (tgErr) {
//       isAuthorized = false; // User not in channel (Silent fail)
//     }

//     if (isAuthorized) {
      
//       // 🛡️ 3. Security Check: Prevent Duplicate Account Linking
//       const existingUser = await User.findOne({ telegramId: telegramUserId.toString() });

//       if (existingUser && existingUser._id.toString() !== userIdFromLink) {
//         return ctx.reply(
//           `Oops! 😅\n\nThis Telegram account is already connected to another user. Please use your own Telegram account to keep your earnings secure.`
//         );
//       }

//       // 🔄 4. Database Synchronization (Updating isTelegramJoined)
//       const updatedUser = await User.findByIdAndUpdate(userIdFromLink, {
//         telegramId: telegramUserId.toString(),
//         isTelegramJoined: true
//       });

//       if (!updatedUser) {
//         return ctx.reply("We couldn't connect your account right now. 😔 Please try again from the website or contact support.");
//       }

//       // 🎉 5. Success Response (Exactly your message)
//       ctx.reply(
//         `🎉 Awesome, ${firstName}! Your account is successfully verified! ✅\n\n` +
//         `Why we ask you to join our channel:\n` +
//         `🚀 Get instant updates on your earnings.\n` +
//         `🔔 Receive important platform announcements.\n` +
//         `🎁 Never miss out on new offers.\n\n` +
//         `Your dashboard is fully unlocked! Click the button below to log in and start earning. ✨`,
//         {
//           reply_markup: {
//             inline_keyboard: [
//               [
//                 { text: "🌐 Go to Website / Login", url: "https://cryptocommunity.live/login" }
//               ]
//             ]
//           }
//         }
//       );
      
//       console.log(`✨ [VERIFIED] User ${userIdFromLink} linked with TG ${telegramUserId}`);
      
//     } else {
//       // 🛑 Membership Denied Message (Exactly your message)
//       ctx.reply(
//         `Hold on! 🛑 It looks like you haven't joined our official channel yet.\n\n` +
//         `Joining is mandatory so we can keep you updated on your account status and earnings. 💰\n\n` +
//         `👉 Step 1: Join ${channelUsername} first.\n` +
//         `👉 Step 2: Come back here and click /start again to verify!`
//       );
//     }
//   } catch (error) {
//     // Sirf real system errors print honge
//     if (error.code !== 400 && error.code !== 403) {
//         console.error("Critical Bot Error:", error.message);
//     }
//     ctx.reply("Oops! Something went wrong on our end. 🛠️ Please wait a moment and try again.");
//   }
// });
//   // Global Error Handler for Bot
//   bot.catch((err, ctx) => {
//     console.log(`[BOT ERROR] Error for ${ctx.updateType}:`, err);
//   });

//   // Launch Bot
//   bot.launch()
//     .then(() => console.log(`🤖 Telegram Bot: Active (Monitoring ${channelUsername})`))
//     .catch((err) => console.error("❌ Failed to launch Telegram Bot:", err));

//   // Graceful Shutdown
//   process.once('SIGINT', () => bot.stop('SIGINT'));
//   process.once('SIGTERM', () => bot.stop('SIGTERM'));
// };

// // Exporting both for Route Re-checks and Server Setup
// module.exports = { bot, setupTelegramBot };