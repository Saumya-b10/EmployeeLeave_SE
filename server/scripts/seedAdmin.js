const dotenv = require("dotenv");
dotenv.config();

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
        const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
        const adminName = process.env.ADMIN_NAME || "System Administrator";
        const adminDepartment = process.env.ADMIN_DEPARTMENT || "Administration";

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            if (existingAdmin.role !== "admin") {
                existingAdmin.role = "admin";
                await existingAdmin.save();
                console.log(`Promoted existing user "${adminEmail}" to admin.`);
            } else {
                console.log(`Admin account "${adminEmail}" already exists.`);
            }
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

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
