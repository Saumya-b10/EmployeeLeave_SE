const mongoose = require("mongoose");
const dns = require("dns");

// Set reliable DNS servers for MongoDB Atlas SRV lookups on Windows/ISP networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("mongo connected");
  } catch (err) {
    console.log("MongoDB connection error:", err.message);
  }
};

module.exports = connectDb;
