const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");

//capture the payment and initiate the payment order
exports.capturePayment = async (req, res) => {
  //get courseID and userID
  const { course_id } = req.body;
  const { userId } = req.user.id;
  //validate
  //valid courseID
  if (!course_id) {
    return res.status(403).json({
      success: false,
      message: "Please provide valid course Id.",
    });
  }
  //valid courseDetails
  let course;
  try {
    course = await Course.findById(course_id);
    if (!course) {
      return res.status(403).json({
        success: false,
        message: "Course not found.",
      });
    }
    // Convert the userId into ObjectID as Course.studentEnrolled is an array of ObjectID(check Course model)
    const uid = new mongoose.Schema.Types.ObjectId(userId);

    //user already pay for the same course
    if (Course.studentEnrolled.includes(uid)) {
      return res.status(200).json({
        success: false,
        message: "Student is already enrolled for this course.",
        error: err.message,
      });
    }

    //prepare receipt data
    const amount = Course.price;
    const currency = "INR";
    const options = {
      amount: amount * 100, // INR unit is paisa
      currency: currency, // INR unit is paisa
      receipt: `receipt_${new Date().getTime()}`, // Unique receipt identifier
      notes: {
        courseId: course_id,
        userId: userId,
      },
      // receipt:Math.random(Date.now()).toString(); // babbar way
    };

    try {
      // initiate the payment using razorpay
      const paymentResponse = await instance.orders.create(options);
      console.log(paymentResponse);
      // return the response
      return res.status(200).json({
        success: true,
        message: "Payment initiated Successfully.",
        courseName: Course.courseName,
        courseDescription: Course.courseDescription,
        thumbnail: Course.thumbnail,
        orderId: paymentResponse.id,
        currency: paymentResponse.currency,
        amount: paymentResponse.amount,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Error while initiating order.",
        error: err.message,
      });
    }
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Course not found",
    });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const webHookSecret = "12345678";
    const razorpaySignature = req.headers["x-razorpay-signature"];

    //Creates and returns an Hmac object that uses the given algorithm and key
    const shasum = crypto.createHmac("sha256", webHookSecret);
    shasum.update(JSON.stringify(req.body));
    // get the hexadecimal representation of the digest(output comes after applying hashing on input)
    const digest = shasum.digest("hex");
    if (razorpaySignature === digest) {
      console.log("Payment is Authorized");

      const { courseId, userId } = req.body.payload.payment.entity.notes;
      try {
        //find the course and enroll student in it
        const enrolledCourse = await Course.findByIdAndUpdate(
          { _id: courseId },
          {
            $push: { studentEnrolled: userId },
          },
          { new: true }
        )
          .populate("studentEnrolled")
          .exec();

        if (!enrolledCourse) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }
        console.log("enrolledCourse: ", enrolledCourse);

        //find the student and add the course to their list (enrolled courses me)
        const enrolledStudent = await User.findByIdAndUpdate(
          { _id: userId },
          {
            $push: { courses: courseId },
          },
          { new: true }
        )
          .populate("enrolledCourses")
          .exec();
        //send confirmation email
        const emailResponse = await mailSender(
          enrolledStudent.email,
          "Congratulations Mail from CODEHELP",
          "Congratulations!! You are onboarded to the new course of CODEHELP"
        );
        console.log("email response", emailResponse);
        return res.status(200).json({
          success: true,
          message: "Signature verified and Course added",
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Error while verifying signature.",
          error: err.message,
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid Signature",
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
