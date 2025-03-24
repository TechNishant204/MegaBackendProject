const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config();

// CREATE OTP and SAVE IN DB
exports.sendOTP = async (req, res) => {
  try {
    // fetch email from request body
    const { email } = req.body;

    //check if user already exist
    const checkUserPresent = await User.findOne({ email });

    //if User already exist return a response
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User is already registered",
      });
    }

    //generate OTP
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log("OTP generated", otp);

    //fetch otp from database if available
    const result = await OTP.findOne({ otp: otp });

    //loop execute until unique OTP is not generated
    while (result) {
      var otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };

    //create an entry in OTP collection
    const otpBody = await OTP.create(otpPayload);
    console.log("OTP created: ", otpBody);

    //return a response
    res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      OTP: otp,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      success: false,
      message: "Error generating in OTP",
    });
  }
};

// USER SIGNUP
exports.signup = async (req, res) => {
  try {
    //fetch data from req.body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    // Validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !contactNumber ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    //match password and confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match....Please try again",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered with this email.",
      });
    }

    //find the most recent OTP for the user email
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);
    if (recentOtp.length == 0) {
      //OTP not found for the email
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    } else if (otp !== recentOtp[0].otp) {
      //Invalid OTP
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    //Hashed Password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create the user
    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);

    //create Profile (you only need to update the profile in profile controller, no need to create)
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      profession: null,
      contactNumber: null,
      about: null,
    });

    //create Entry of User in DB
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType: accountType,
      contactNumber,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return Response
    res.status(200).json({
      success: true,
      message: "User registered successfully.",
      data: user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered...Please try again",
    });
  }
};

// USER LOGIN
exports.login = async (req, res) => {
  try {
    //fetch data from req.body
    const { email, password } = req.body;

    //Validation
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email })
      .populate("additionalDetails")
      .exec();

    // user exist or not
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered...Please first Signup",
      });
    }

    //create payload to pass in jwt
    const payload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType,
    };

    //compare password using bcrypt and generate jwt token
    if (await bcrypt.compare(password, hashedPassword)) {
      //generate token using jwt
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      //Save token to user document in database
      user.token = token;
      user.password = undefined;

      //create option to pass in cookie
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //3 days
        httpOnly: true, // only server can access
      };

      // Set cookie for token and return success response
      res.cookie("token", token, options).status(200).json({
        success: true,
        token: token,
        user: user,
        message: "User logged in successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is Incorrect...Try Again",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Login Failure...Please try again",
    });
  }
};

//changePassword
exports.changePassword = async (req, res) => {
  //fetch data from req body
  const { oldPassword, newPassword, confirmPassword } = req.body;

  //Validation
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(403).json({
      success: false,
      message: "Please fill all fields",
    });
  }

  //Check if new password and confirm password match
  if (newPassword !== confirmPassword) {
    return res.status(403).json({
      success: false,
      message: "Password and Confirm Password do not match",
    });
  }

  //Update Password in DB
  const encryptedPassword = await bcrypt.hash(newPassword, 10);
  const updatedUserDetails = await User.findByIdAndUpdate(
    req.user.id,
    { password: encryptedPassword },
    { new: true }
  );

  //Send Notification Mail to user
  try {
    const emailResponse = await mailSender(
      updatedUserDetails.email,
      "Password Changed Successfully",
      passwordUpdated(
        updatedUserDetails.email,
        `Password Updated Successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName} `
      )
    );
    console.log("Email Sent Successfully: ", emailResponse.response);

    return res.status(200).json({
      success: true,
      message: "Password Updated Successfully",
    });
  } catch (err) {
    // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while sending email:", err);
    return res.status(500).json({
      success: false,
      message: "Error occurred while Updating Password",
      error: err.message,
    });
  }
};
