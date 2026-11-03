const User = require("../models/User");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// Safe user mapper to prevent sensitive field leakage and ensure both id and _id are available
const toSafeUser = (user) => ({
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || "General",
    totalLeaveDays: user.totalLeaveDays ?? 20,
    createdAt: user.createdAt
});

// Update user role
const updateUserRole = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format"
        });
    }

    const { role } = req.body;

    // Safety guard: prevent administrator from demoting themselves
    if (req.user.id === userId && role !== "admin") {
        return res.status(400).json({
            success: false,
            message: "Action rejected: You cannot demote your own administrator account."
        });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    user.role = role;
    await user.save();

    const safeUser = toSafeUser(user);
    res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: safeUser,
        user: safeUser
    });
});

// Get all users
const getAllUser = asyncHandler(async (req, res) => {
    const users = await User.find({}).sort({ createdAt: -1 });
    const safeUsers = users.map(toSafeUser);

    return res.status(200).json({
        success: true,
        data: safeUsers,
        user: safeUsers
    });
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format"
        });
    }

    // Safety guard: prevent administrator from deleting themselves
    if (req.user.id === userId) {
        return res.status(400).json({
            success: false,
            message: "Action rejected: You cannot delete your own administrator account."
        });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    // Guard against deleting the only admin
    if (userToDelete.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
            return res.status(400).json({
                success: false,
                message: "Action rejected: Cannot delete the only remaining administrator."
            });
        }
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});

module.exports = { updateUserRole, getAllUser, deleteUser };