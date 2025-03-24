const Course = require("../models/Course");
const Section = require("../models/Section");

//CREATE SECTION
exports.createSection = async (req, res) => {
  try {
    //data fetch
    const { sectionName, courseID } = req.body;

    //data validate
    if (!sectionName || !courseID) {
      return res.status(400).json({
        success: false,
        message: "Please provide sectionName and CourseID",
      });
    }

    // Create a new section
    const newSection = await Section.create({ sectionName });

    //update course with new section ObjectId
    //HW: use populate to replace sections/subsections both in the updatedCourseDetails
    const updatedCourse = await Course.findByIdAndUpdate(
      { courseID },
      {
        $push: { courseContent: newSection._id },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "sectionName",
        },
      })
      .exec();

    //return response
    res.status(200).json({
      success: true,
      message: "Section created successfully",
      data: updatedCourse,
    });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to create new section, Please try again...",
      error: err.message,
    });
  }
};

// UPDATE SECTION
exports.updateSection = async (req, res) => {
  try {
    //data fetch
    const { sectionID, sectionName } = req.body;
    // data validate
    if (!sectionID || !sectionName) {
      return res.status(403).json({
        success: false,
        message: "Please provide sectionID and sectionName",
      });
    }

    // update section using findByIdAndUpdate
    const updatedSection = await Section.findByIdAndUpdate(
      sectionID,
      { sectionName },
      { new: true }
    );

    // return response
    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update the section, Please try again...",
      error: err.message,
    });
  }
};

// delete section
exports.deleteSection = async (req, res) => {
  try {
    //fetch sectionID from params (deleteSection/:id)
    const { sectionID } = req.params;
    // data validate
    if (!sectionID) {
      return res.status(403).json({
        success: false,
        message: "Please provide correct sectionID",
      });
    }

    // delete section
    const deletedSection = await Section.findByIdAndDelete(sectionID);
    // TODO: Do we need to delete the entry from the course schema

    // return response
    res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      data: deletedSection,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to delete the section, Please try again...",
      error: err.message,
    });
  }
};
