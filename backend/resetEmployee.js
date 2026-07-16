const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const resetEmployee = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MongoDB URI missing in .env");
    }

    await mongoose.connect(mongoURI);

    const email = "dhikondagopinaidu@gmail.com";
    const password = "Gopi@1433";

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { email },
      {
        name: "Dhikonda Gopi",
        email,
        password: hashedPassword,
        role: "employee",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log("Employee account ready");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
  } catch (error) {
    console.error("Employee reset failed:", error.message);
    process.exit(1);
  }
};

resetEmployee();