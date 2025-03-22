const nodemailer = require("nodemailer");
require("dotenv").config();

// Mail Sender Function to send OTP to the user
const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: "StudyNation || CODEPRO - by Mahto",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log(info);
  } catch (error) {
    console.log(error.message);
  }
  return info;
};

module.exports = mailSender;
