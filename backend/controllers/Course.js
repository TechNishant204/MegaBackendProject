const Course = require("../models/Course");
const User = require("../models/User");
const Tag = require("../models/Tag");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//Create Course
exports.createCourse = async (req, res) => {
  try {
    // GET user ID from request object
    const userID = req.user.id; //set in auth middleware fetched from JWT payload

    //fetch data
    const { courseName, courseDescription, whatYouWillLearn, price, tag } =
      req.body;
    //get thumbnail
    const thumbnail = req.files.thumbnailImage;

    //validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !thumbnail
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required...",
      });
    }

    //check for Instructor
    const instructorDetails = await User.findById({ userID });
    console.log("Instructor Details", instructorDetails);
    // TODO:verify that user.id and instructorDetails._id are same or different

    if (!instructorDetails) {
      return res.status(403).json({
        success: false,
        message: "Instructor Details not found...",
      });
    }

    //check given tag valid or not
    const tagDetails = await Tag.findById({ tag });
    if (!tagDetails) {
      return res.status(403).json({
        success: false,
        message: "Invalid Tag...",
      });
    }

    //upload Image to cloudinary
    const uploadedThumbnail = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    //create entry for course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      tag: tagDetails._id,
      thumbnail: thumbnailImage.secure_url,
    });

    //add the new course in the user schema of Instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: { courses: newCourse._id },
      },
      { new: true }
    );

    //update the tag schema
    await Tag.findByIdAndUpdate(
      { _id: tagDetails._id },
      {
        $push: { courses: newCourse._id },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Course Created Successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error occurred while creating a course",
      error: err.message,
    });
  }
};

//GET- fetched all courses
exports.showAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();

    return res.status(200).json({
      success: true,
      message: "All Courses Fetched Successfully",
      data: allCourses,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error occurred while fetching all courses",
      error: err.message,
    });
  }
};

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
  try {
    //get CourseId
    const { courseId } = req.body;
    const courseDetails = await Course.findById({ _id: courseId })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate({ category })
      .populate({ ratingAndReviews })
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Course Not Found for the given ${courseId}`,
      });
    }

    //return response
    res.status(200).json({
      success: true,
      message: "Course Details Fetched Successfully",
      data: courseDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error occurred while fetching course details",
      error: err.message,
    });
  }
};
