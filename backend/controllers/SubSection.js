const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

// CREATE SUBSECTIONS
exports.createSubsection = async (req, res) => {
  try {
    //fetch data from req body
    const { sectionID, title, timeDuration, description } = req.body;

    //extract files/video
    const video = req.files.videoFile;
    //validate
    if (!sectionID || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }
    //upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    //create subsection
    const subSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      video: uploadDetails.secure_url,
    });

    //update section with new subsection object Id
    const updatedSection = await Section.findByIdAndUpdate(
      sectionID,
      {
        $push: { subSection: subSectionDetails._id },
      },
      { new: true }
    );
    //HW: log updated section here after adding populate query
    //return response
    res.status(200).json({
      success: true,
      message: "Subsection created successfully",
      data: updatedSection,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error creating subsection",
      error: err.message,
    });
  }
};

//UPDATE SUBSECTION
exports.updateSubSection = async (req, res) => {
  try {
    //data fetch
    const { SubSectionID, title, timeDuration, description } = req.body;

    //extract files/video
    const video = req.files.videoFile;

    // data validate
    if (!SubSectionID || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }
    //upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    // update section using findByIdAndUpdate
    const updatedSubSection = await SubSection.findByIdAndUpdate(
      SubSectionID,
      { title: title },
      { timeDuration: timeDuration },
      { description: description },
      { video: uploadDetails.secure_url },
      { new: true }
    );

    // return response
    res.status(200).json({
      success: true,
      message: "SubSection updated successfully",
      data: updatedSubSection,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update the SubSection, Please try again...",
      error: err.message,
    });
  }
};

// DELETE SUBSECTION
exports.deleteSection = async (req, res) => {
  try {
    //fetch sectionID from params (deleteSection/:id)
    const { SubSectionID } = req.params;
    // data validate
    if (!SubSectionID) {
      return res.status(403).json({
        success: false,
        message: "Please provide correct SubSectionID",
      });
    }

    // delete Subsection
    const deletedSubSection = await SubSection.findByIdAndDelete(SubSectionID);
    // TODO: Do we need to delete the entry from the section schema?

    // return response
    res.status(200).json({
      success: true,
      message: "SubSection deleted successfully",
      data: deletedSubSection,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to delete the SubSection, Please try again...",
      error: err.message,
    });
  }
};
