const Profile = require("../models/Profile");
const User = require("../models/User");

exports.updateProfile = async (req, res) => {
  try {
    //data fetch
    const {
      gender,
      dateOfBirth = "",
      profession = "",
      contactNumber,
      about = "",
    } = req.body;

    const id = req.user.id; //we have inserted in auth from payload
    //data validation
    if (!gender || !contactNumber || !id) {
      return res.status(403).json({
        success: false,
        message: "Please fill all the required fields.",
      });
    }
    //find Profile
    const userDetails = await User.findById(id);
    const profileID = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileID);

    //update Profile
    profileDetails.gender = gender;
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.profession = profession;
    profileDetails.contactNumber = contactNumber;
    profileDetails.about = about;
    await profileDetails.save(); // save the updated profile details

    res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      data: profileDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error while updating the profile",
      error: err.message,
    });
  }
};

//DELETE ACCOUNT (Explore how can we schedule this deletion operation)
exports.deleteAccount = async (req, res) => {
  try {
    //TODO: Find more on Job Schedule
    // const job = schedule.scheduleJob("10 * * * * *",function(){
    // console.log("The job will run on every minute");
    //})
    // console.log(job)
    //data fetch
    const userID = req.user.id;
    const user = await User.findById(userID);
    //data validate
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Please provide the correct ID. User not found",
      });
    }

    //delete the associated profile with the user
    const deletedProfile = await Profile.findByIdAndDelete({
      _id: user.userDetails,
    });
    //TODO: HW unenroll user from all enrolled courses

    //Now delete the user
    const deletedUser = await User.findByIdAndDelete({ _id: userID });

    //return response
    res.status(200).json({
      success: true,
      message: "Account Deleted Successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error while deleting the account",
      error: err.message,
    });
  }
};

// GET-ALL USER DETAILS
exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const userDetails = await User.findById({ _id: id })
      .populate("additionalDetails")
      .exec();
    console.log("user Details: ", userDetails);
    return res.status(200).json({
      success: true,
      message: "User details Fetched Successfully",
      data: userDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error while fetching all user details",
    });
  }
};
