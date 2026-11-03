const Leave = require("../models/Leave");
const User = require("../models/User");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// Helper: Calculate inclusive days between two dates normalized to UTC midnight
const calculateDays = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((utcTo - utcFrom) / (1000 * 60 * 60 * 24)) + 1;
};

// Apply for leave with date, overlap, and balance validation
const applyLeave = asyncHandler(async (req, res) => {
    const { fromDate, toDate, reason } = req.body;

    if (!fromDate || !toDate) {
        return res.status(400).json({
            success: false,
            message: "From Date and To Date are required"
        });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Invalid date format"
        });
    }

    if (end < start) {
        return res.status(400).json({
            success: false,
            message: "To Date cannot be earlier than From Date"
        });
    }

    const requestedDays = calculateDays(start, end);
    if (requestedDays <= 0) {
        return res.status(400).json({
            success: false,
            message: "Leave duration must be at least 1 day"
        });
    }

    // 1. Check for overlapping pending or approved leaves
    const overlap = await Leave.findOne({
        user: req.user.id,
        status: { $in: ["pending", "approved"] },
        fromDate: { $lte: end },
        toDate: { $gte: start }
    });

    if (overlap) {
        return res.status(400).json({
            success: false,
            message: "You already have a pending or approved leave request overlapping with the selected dates"
        });
    }

    // 2. Validate leave balance
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User account not found"
        });
    }

    const existingLeaves = await Leave.find({
        user: req.user.id,
        status: { $in: ["approved", "pending"] }
    });

    let usedDays = 0;
    let pendingDays = 0;

    for (const l of existingLeaves) {
        const days = calculateDays(l.fromDate, l.toDate);
        if (l.status === "approved") usedDays += days;
        if (l.status === "pending") pendingDays += days;
    }

    const totalAllowed = user.totalLeaveDays ?? 20;
    const remainingDays = totalAllowed - usedDays;
    const availableDays = remainingDays - pendingDays;

    if (requestedDays > availableDays) {
        return res.status(400).json({
            success: false,
            message: `Insufficient leave balance. You requested ${requestedDays} day(s), but only have ${Math.max(0, availableDays)} day(s) available (${remainingDays} remaining minus ${pendingDays} pending).`
        });
    }

    // Create leave
    const leave = await Leave.create({
        user: req.user.id,
        fromDate: start,
        toDate: end,
        reason: reason.trim()
    });

    return res.status(201).json({
        success: true,
        message: "Leave applied successfully",
        data: leave,
        leave
    });
});

// Getting all leaves for the authenticated user
const getLeaves = asyncHandler(async (req, res) => {
    const leaves = await Leave.find({ user: req.user.id })
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: leaves
    });
});

// Getting team leaves for manager or admin
const getAllLeaves = asyncHandler(async (req, res) => {
    const query = { user: { $ne: req.user.id } };

    // Managers primarily oversee employees; Admins oversee managers and employees
    const leaves = await Leave.find(query)
        .populate("user", "name email role department")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: leaves
    });
});

// Updating leave status (approve / reject)
const updateLeave = asyncHandler(async (req, res) => {
    const leaveId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format"
        });
    }

    const { status } = req.body;
    const allowedStatuses = ["approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be 'approved' or 'rejected'"
        });
    }

    const leave = await Leave.findById(leaveId).populate("user");
    if (!leave) {
        return res.status(404).json({
            success: false,
            message: "Leave request not found"
        });
    }
    // Prevent self-approval: a user cannot approve or reject their own leave request
    if (leave.user && leave.user._id.toString() === req.user.id) {
        return res.status(403).json({
            success: false,
            message: "Self-approval of leave requests is not allowed."
        });
    }


    const applicantRole = leave.user?.role;
    const approverRole = req.user.role;

    // Role-based approval rules
    if (approverRole === "manager" && applicantRole !== "employee") {
        return res.status(403).json({
            success: false,
            message: "Managers are authorized to approve employee leaves only."
        });
    }

    if (approverRole === "admin" && !["manager", "employee"].includes(applicantRole)) {
        return res.status(403).json({
            success: false,
            message: "Administrators can approve employee and manager requests."
        });
    }

    leave.status = status;
    await leave.save();

    return res.status(200).json({
        success: true,
        message: `Leave ${status} successfully`,
        data: leave,
        leave
    });
});

// Get leave balance calculation
const getLeaveBalance = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    const approvedLeaves = await Leave.find({
        user: req.user.id,
        status: "approved"
    });

    let usedDays = 0;
    for (const leave of approvedLeaves) {
        usedDays += calculateDays(leave.fromDate, leave.toDate);
    }

    const pendingLeaves = await Leave.find({
        user: req.user.id,
        status: "pending"
    });

    let pendingDays = 0;
    for (const leave of pendingLeaves) {
        pendingDays += calculateDays(leave.fromDate, leave.toDate);
    }

    const totalLeaveDays = user.totalLeaveDays ?? 20;
    const remainingDays = Math.max(0, totalLeaveDays - usedDays);
    const availableDays = Math.max(0, remainingDays - pendingDays);

    return res.status(200).json({
        success: true,
        data: {
            totalLeaveDays,
            usedLeaveDays: usedDays,
            pendingLeaveDays: pendingDays,
            remainingLeaveDays: remainingDays,
            availableLeaveDays: availableDays
        }
    });
});

module.exports = {
    applyLeave,
    getLeaves,
    getAllLeaves,
    updateLeave,
    getLeaveBalance
};
