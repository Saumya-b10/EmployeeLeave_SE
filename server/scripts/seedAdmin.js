const dotenv = require("dotenv");
dotenv.config();

const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
    try {
        if (!process.env.MONGO_DB_URL) {
            console.error("Error: MONGO_DB_URL is not defined in environment variables.");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_DB_URL);
        console.log("Connected to MongoDB for admin setup.");

        const adminEmail = (process.env.ADMIN_EMAIL || "admin@swiftly.local").toLowerCase().trim();
        const adminPassword = process.env.ADMIN_PASSWORD || "123456";
        const adminName = process.env.ADMIN_NAME || "System Administrator";
        const adminDepartment = process.env.ADMIN_DEPARTMENT || "Administration";

        const existingAdmin = await User.findOne({ email: adminEmail });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        if (existingAdmin) {
            existingAdmin.role = "admin";
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log(`Updated existing admin "${adminEmail}" with password: ${adminPassword}`);
        } else {
            await User.create({
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
                department: adminDepartment,
                totalLeaveDays: 20
            });

            console.log(`Default administrator created successfully:`);
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
            console.log(`Role: admin`);
            console.log(`Department: ${adminDepartment}`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("Admin seeding failed:", error);
        process.exit(1);
    }
};

seedAdmin();
