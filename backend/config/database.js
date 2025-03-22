const mongoose = require("mongoose");
require("dotenv").config();


exports.connectDB = async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MONGODB Successfully..."))
    .catch((err) => {
      console.log("Failed to connect to MongoDB", err);
      process.exit(1);
    });
};
