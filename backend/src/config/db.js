const mongoose = require("mongoose");
const dns = require("dns");

// Use reliable DNS servers
dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI;

    // Check if MONGO_URI exists
    if (!mongoURI) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    // Check MongoDB URI format
    if (
      !mongoURI.startsWith("mongodb://") &&
      !mongoURI.startsWith("mongodb+srv://")
    ) {
      throw new Error(
        'Invalid MONGO_URI. It must start with "mongodb://" or "mongodb+srv://"'
      );
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;