const User = require("../models/User");
const mailSender = require("../utils/mailSender");
require("dotenv").config();
const bcrypt = require("bcrypt");

//ResetPasswordToken
exports.resetPasswordToken = async (req, res) => {
  try {
    //get email from req body
    const email = req.body.email;

    //check if email exists in db
    const user = await User.findOne({ email: email });

    //email validation
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Your Email is not registered",
      });
    }

    //generate token
    const token = crypto.randomUUID();

    //update user by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      { token: token, resetPasswordExpires: Date.now() + 5 * 60 * 1000 },
      { new: true }
    );

    //create Url
    const url = `http://localhost:3000/update-password/${token}`;

    //send mail containing URL
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link: ${url}`
    );
    //return response
    return res.status(200).json({
      success: true,
      message:
        "Email sent successfully.Please check your mail and change your password",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending reset mail...",
    });
  }
};

//Reset Password
exports.resetPassword = async (req, res) => {
  try {
    //fetch the data from request
    const { password, confirmPassword, token } = req.body;

    //validation
    if (!password || !confirmPassword || !token) {
      return res.status(403).json({
        success: false,
        message: "",
      });
    }
    //check if password and confirm password are same
    if (password !== confirmPassword) {
      return res.status(403).json({
        success: false,
        message: "Password and Confirm Password are not matched.",
      });
    }

    //fetch user using token
    const userDetails = await User.findOne({ token: token });
    if (!userDetails) {
      return res.status(403).json({
        success: false,
        message: "Invalid Token",
      });
    }

    //token time check
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(403).json({
        success: false,
        message: "Token is expired. Please request for new token.",
      });
    }

    //HashPassword
    const hashedPassword = await bcrypt.hash(password, 10);

    //Update new password in database
    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Password Reset Successfully...",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting password...",
    });
  }
};
