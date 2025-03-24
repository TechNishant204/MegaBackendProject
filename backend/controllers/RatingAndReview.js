const User = require("../models/User");
const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

exports.createRating = async (req, res) => {
  try {
    //get User Id from auth middleware payload
    const userId = req.user.id;
    //fetch rating and review
    const { rating, review, courseId } = req.body;

    //check if user is enrolled or not
    const courseDetails = await Course.findOne(
      { _id: courseId },
      {
        studentsEnrolled: { $elemMatch: { $eq: userId } },
      }
    );

    //validate
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in the course.",
      });
    }

    //check if user already reviewed the course
    const alreadyReviewed = await RatingAndReview.findOne(
      { user: userId },
      { course: courseId }
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this course.",
      });
    }

    //create Rating and Review
    const ratingReview = new RatingAndReview({
      rating,
      review,
      user: userId,
      course: courseId,
    });
    console.log("ratingAndReview", ratingReview);

    //update course with this rating review in ratingAndReview array
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          ratingsAndReviews: ratingReview._id,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Course rated and reviewed successfully",
      data: ratingReview,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to create rating",
    });
  }
};

//get Average rating
const getAverageRating = async (req, res) => {
  try {
    //get Course Id
    const courseId = req.body.courseId;

    //calculate average rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Schema.ObjectId(courseId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    //return rating (result is an array received by aggregate)
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Average rating retrieved successfully",
        averageRating: 0,
      });
    }

    //if not rating found
    return res.status(200).json({
      success: true,
      message: "No ratings found for this course",
      averageRating: result[0].averageRating,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to get average rating",
      error: err.msg,
    });
  }
};

//get All Course Rating
exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        select: "firstName lastName email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No Ratings and Reviews found for this course",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All Rating and Reviews fetched successfully",
      data: allReviews,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to get all ratings",
      error: err.msg,
    });
  }
};
