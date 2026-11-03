const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");

// Safe user mapper to prevent sensitive field leakage
const toSafeUser = (user) => ({
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || "General",
    totalLeaveDays: user.totalLeaveDays ?? 20
});

//  registering user
const registerUser = asyncHandler(async (req, res) => {
    const { name, password, department } = req.body;
    
    // Email normalization and validation
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        });
    }

    if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Name is required"
        });
    }

    if (typeof password !== "string" || password.trim().length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters"
        });
    }

    // Check if user already exists
    const userExist = await User.findOne({ email });
    if (userExist) {
        return res.status(400).json({
            success: false,
            message: "User already exists with this email"
        });
    }
     
    // If no users exist in the system yet, automatically bootstrap the first user as admin
    const userCount = await User.countDocuments();
    const initialRole = userCount === 0 ? "admin" : "Approval-Pending";

    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name: name.trim(),
        email,
        password: hashedPassword,
        department: typeof department === "string" && department.trim() ? department.trim() : "General",
        role: initialRole,
        totalLeaveDays: 20
    });

    // Generate JWT token
    const token = await jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
    );

    const message = initialRole === "admin"
        ? "First user registered and assigned Administrator role successfully!"
        : "Account created successfully! Please wait for Administrator approval.";

    res.status(201).json({
        success: true,
        message,
        token,
        user: toSafeUser(user),
    });
});

//  log in
const loginUser = asyncHandler(async (req, res) => {
    const { password } = req.body;

    // Email normalization and validation
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        });
    }

    if (typeof password !== "string" || !password.trim()) {
        return res.status(400).json({
            success: false,
            message: "Password is required"
        });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    if (!["admin", "employee", "manager"].includes(user.role)) {
        return res.status(403).json({
            success: false,
            message: "Account verification pending. Please wait for an administrator to approve your account."
        });
    }

    // Check password
    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT
    const token = await jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
    );

    res.json({
        success: true,
        message: "Login successful",
        token,
        user: toSafeUser(user),
    });
});

module.exports = { registerUser, loginUser, toSafeUser };
