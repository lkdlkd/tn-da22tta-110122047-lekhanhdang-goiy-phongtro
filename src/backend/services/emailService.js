const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
  },
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000,   // 5 seconds
  socketTimeout: 8000,     // 8 seconds
})

/**
 * Gửi email
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"PhòngTrọ VL" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  }
  await transporter.sendMail(mailOptions)
}

module.exports = { sendEmail }
