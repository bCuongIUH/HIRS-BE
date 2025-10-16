const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  // Tạo transporter với SMTP Gmail
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true nếu port = 465
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    text,
  };

  // Gửi email
  await transporter.sendMail(message);
};

module.exports = sendEmail;
