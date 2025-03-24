const jwt = require("jsonwebtoken");
require("dotenv").config(); // use:to fetch the environment variables from .env file
const User = require("../models/User");

//authentication middleware
exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorisation").replace("Bearer", "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is missing",
      });
    }

    //Verify the token
    try {
      const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
      console.log(decodedPayload);
      req.user = decodedPayload;
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
      });
    }
    next();
  } catch (err) {
    console.log("error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//IsStudent
exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(400).json({
        success: false,
        message: "This is a protected route for Students only",
      });
    }
    next();
  } catch (err) {
    console.log("error: ", err);
    return res.status(500).json({
      success: false,
      message: "User Role cannot be verified",
    });
  }
};

//IsInstructor
exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Instructor") {
      return res.status(400).json({
        success: false,
        message: "This is a protected route for Instructor only",
      });
    }
    next();
  } catch (err) {
    console.log("error: ", err);
    return res.status(500).json({
      success: false,
      message: "User Role cannot be verified...",
    });
  }
};

//IsAdmin
exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(400).json({
        success: false,
        message: "This is a protected route for Admin only",
      });
    }
    next();
  } catch (err) {
    console.log("error: ", err);
    return res.status(500).json({
      success: false,
      message: "User Role cannot be verified...",
    });
  }
};
