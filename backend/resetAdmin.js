const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const resetAdmin = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MongoDB URI missing in .env");
    }

    await mongoose.connect(mongoURI);

    const hashedPassword = await bcrypt.hash("password123", 10);

    await User.findOneAndUpdate(
      { email: "admin@cafeflow.com" },
      {
        name: "CafeFlow Admin",
        email: "admin@cafeflow.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log("Admin account ready");
    console.log("Email: admin@cafeflow.com");
    console.log("Password: password123");

    process.exit(0);
  } catch (error) {
    console.error("Admin reset failed:", error.message);
    process.exit(1);
  }
};

resetAdmin();