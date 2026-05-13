require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
   const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",   // ✅ Namecheap SMTP
  port: 465,                       // ✅ SSL Port
  secure: true,                    // ✅ true for 465
  auth: {
    user: process.env.EMAIL_USER,  // e.g. noreply@yourdomain.com
    pass: process.env.EMAIL_PASS,  // email password (NOT app password)
  },
});





    const senderName = process.env.APP_NAME || 'USDT Boomers';

    const mailOptions = {
      from: `"${senderName}" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.messageId);

    return true;

  } catch (error) {
    console.error("❌ Email Error:", error);
    throw error;
  }
};

module.exports = sendEmail;