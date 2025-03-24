const cloudinary = require("cloudinary").v2;

exports.cloudinaryConnect = () => {
  try {
    cloudinary.config({
      /// Configuring The Cloudinary to Upload Media ///
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
  } catch (err) {
    console.log("### Error while connecting to Cloudinary ###");
    console.log(err);
  }
};
