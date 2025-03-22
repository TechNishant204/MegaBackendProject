const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 5 * 60,
  },
});

// a function to generate OTP via sending email
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      title,
      "Verification Email from StudyNation",
      otp
    );
    console.log("Mail sent successfully: ", mailResponse);
  } catch (err) {
    console.log("Error occurred while sending email: ", err);
  }
}

//Here we want to send the otp to user just before the otp document is saved in the database.
// So, we are using a pre-save hook to send the OTP to the user just before saving the OTP document or dbEntry.

OTPSchema.pre("save", async function (next) {
  await sendVerificationEmail(this.email, this.otp);
  next();
});

module.exports = mongoose.model("OTP", OTPSchema);
