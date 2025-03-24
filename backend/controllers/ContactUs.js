const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");

exports.contactUsController = async (req, res) => {
  const { email, firstName, lastName, message, phoneNo, countryCode } =
    req.body;

  if (!email || !firstname || !lastname || !message || !phoneNo) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields",
    });
  }

  try {
    const emailResponse = await mailSender(
      email,
      "Your Data sent successfully",
      contactUsEmail(email, firstName, lastName, message, phoneNo, countryCode)
    );
    console.log("Email Response  ", emailResponse);
    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later.",
      error: error.message,
    });
  }
};
