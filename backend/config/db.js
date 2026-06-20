const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI or MONGODB_URI is missing in backend/.env");
    }

    console.log(
      "Using MongoDB URI:",
      mongoURI.includes("mongodb+srv")
        ? "MongoDB Atlas URI loaded"
        : mongoURI
    );

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;