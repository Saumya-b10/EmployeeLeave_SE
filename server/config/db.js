const mongoose = require("mongoose");

const connectDb = async () => {
  const mongoUri = process.env.MONGO_DB_URL || "mongodb://127.0.0.1:27017/employee_leave";

  try {
    console.log("Connecting to local MongoDB (Compass)...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB connected successfully to:", mongoUri);
  } catch (err) {
    console.error("\n❌ MongoDB connection error:", err.message);
    console.error("👉 Ensure your local MongoDB service is running (or open MongoDB Compass and connect to mongodb://127.0.0.1:27017)\n");
  }
};

module.exports = connectDb;
