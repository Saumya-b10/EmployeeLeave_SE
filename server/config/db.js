const mongoose = require("mongoose");
const dns = require("dns");

// Set reliable DNS servers for MongoDB Atlas SRV lookups on Windows/ISP networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

const connectDb = async () => {
  const primaryUri = process.env.MONGO_DB_URL;
  const localFallbackUri = "mongodb://127.0.0.1:27017/employee_leave";

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 8000 });
    console.log("✅ MongoDB connected successfully to:", primaryUri.includes("mongodb+srv") ? "MongoDB Atlas (Cloud)" : "Local MongoDB");
  } catch (err) {
    console.error("\n❌ MongoDB Connection Error:", err.message);

    // If it is an Atlas IP whitelist error
    if (err.message.includes("Could not connect to any servers") || err.message.includes("IP that isn't whitelisted") || err.message.includes("ETIMEDOUT")) {
      console.warn("\n⚠️  ACTION REQUIRED IN MONGODB ATLAS:");
      console.warn("👉 Your current IP address is not whitelisted in MongoDB Atlas.");
      console.warn("👉 Go to: https://cloud.mongodb.com -> Security -> Network Access");
      console.warn("👉 Click 'Add IP Address' -> Choose 'Allow Access from Anywhere' (0.0.0.0/0) -> Click Confirm.\n");
    }

    // Automatic fallback to local MongoDB if cloud connection fails
    if (primaryUri && primaryUri.includes("mongodb+srv")) {
      console.log("🔄 Attempting fallback to local MongoDB (127.0.0.1:27017)...");
      try {
        await mongoose.connect(localFallbackUri, { serverSelectionTimeoutMS: 3000 });
        console.log("✅ Connected to Local MongoDB fallback successfully!");
      } catch (localErr) {
        console.error("❌ Local MongoDB fallback also unavailable:", localErr.message);
      }
    }
  }
};

module.exports = connectDb;
