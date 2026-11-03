const Reimbursement = require("../models/Reimbursement");
const imagekit = require("../config/imagekit");
const { toFile } = require("@imagekit/nodejs");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// Helper: upload buffer to ImageKit
const uploadToImageKit = async (fileBuffer, originalName) => {
  const file = await toFile(fileBuffer, originalName);
  const result = await imagekit.files.upload({
    file,
    fileName: originalName,
    folder: "/reimbursement-bills",
  });
  return { url: result.url, fileId: result.fileId };
};

// Helper: delete file from ImageKit
const deleteFromImageKit = async (fileId) => {
  try {
    await imagekit.files.delete(fileId);
  } catch (err) {
    console.log("ImageKit delete error (non-fatal):", err.message);
  }
};

// Apply for reimbursement
const applyReimbursement = asyncHandler(async (req, res) => {
  const { amount, expenseDate, description } = req.body;

  const numericAmount =
    typeof amount === "string"
      ? Number(amount.trim())
      : Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a positive number",
    });
  }

  let billUrl = null;
  let billFileId = null;

  // Upload bill if file is attached
  if (req.file) {
    const uploaded = await uploadToImageKit(req.file.buffer, req.file.originalname);
    billUrl = uploaded.url;
    billFileId = uploaded.fileId;
  }

  // Creating reimbursement
  const reimbursement = await Reimbursement.create({
    user: req.user.id,
    amount: numericAmount,
    expenseDate,
    description: description.trim(),
    billUrl,
    billFileId,
  });

  return res.status(201).json({
    success: true,
    message: "Reimbursement claim submitted successfully",
    data: reimbursement,
    reimbursement,
  });
});

// Getting all reimbursement claims for a particular user
const getReimbursement = asyncHandler(async (req, res) => {
  const reimbursements = await Reimbursement.find({ user: req.user.id }).sort(
    { createdAt: -1 },
  );
  return res.status(200).json({
    success: true,
    data: reimbursements
  });
});

// Updating reimbursement status (approval/rejection)
const updateReimbursement = asyncHandler(async (req, res) => {
  const reimbursementId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(reimbursementId)) {
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

  const reimbursement = await Reimbursement.findById(reimbursementId).populate("user");
  if (!reimbursement) {
    return res.status(404).json({
      success: false,
      message: "Reimbursement claim not found"
    });
  }
  // Prevent self-approval: a user cannot approve or reject their own reimbursement claim
  if (reimbursement.user && reimbursement.user._id.toString() === req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Self-approval of reimbursement claims is not allowed."
    });
  }


  const applicantRole = reimbursement.user?.role;
  const approverRole = req.user.role;

  // Role permissions
  if (approverRole === "manager" && applicantRole !== "employee") {
    return res.status(403).json({
      success: false,
      message: "Managers can approve employee reimbursements only"
    });
  }

  if (approverRole === "admin" && !["manager", "employee"].includes(applicantRole)) {
    return res.status(403).json({
      success: false,
      message: "Administrators can approve employee and manager reimbursement claims"
    });
  }

  reimbursement.status = status;
  await reimbursement.save();

  return res.status(200).json({
    success: true,
    message: `Reimbursement claim ${status} successfully`,
    data: reimbursement,
    reimbursement
  });
});

// Get all reimbursements for admin or manager
const getAllReimbursement = asyncHandler(async (req, res) => {
  const reimbursements = await Reimbursement.find({ user: { $ne: req.user.id } })
    .populate("user", "name email role department")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: reimbursements,
    reimbursements
  });
});

// Update/replace bill on an existing pending reimbursement
const updateBill = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  const reimbursement = await Reimbursement.findById(req.params.id);
  if (!reimbursement) {
    return res.status(404).json({
      success: false,
      message: "Reimbursement claim not found"
    });
  }

  // Only the owner can update their bill
  if (reimbursement.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: You can only update bills on your own claims"
    });
  }

  // Security guard: Only pending claims can have their bill modified
  if (reimbursement.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: "Cannot modify or replace bills on processed (approved/rejected) reimbursement claims."
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file provided"
    });
  }

  // Delete old file from ImageKit if exists
  if (reimbursement.billFileId) {
    await deleteFromImageKit(reimbursement.billFileId);
  }

  // Upload new file
  const uploaded = await uploadToImageKit(req.file.buffer, req.file.originalname);
  reimbursement.billUrl = uploaded.url;
  reimbursement.billFileId = uploaded.fileId;
  await reimbursement.save();

  return res.status(200).json({
    success: true,
    message: "Bill replaced successfully",
    data: reimbursement,
    reimbursement
  });
});

// Delete bill from a reimbursement
const deleteBill = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  const reimbursement = await Reimbursement.findById(req.params.id);
  if (!reimbursement) {
    return res.status(404).json({
      success: false,
      message: "Reimbursement claim not found"
    });
  }

  // Only the owner can delete their bill
  if (reimbursement.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: You can only delete bills on your own claims"
    });
  }

  // Security guard: Only pending claims can have their bill deleted
  if (reimbursement.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: "Cannot delete bills from processed (approved/rejected) reimbursement claims."
    });
  }

  if (reimbursement.billFileId) {
    await deleteFromImageKit(reimbursement.billFileId);
  }

  reimbursement.billUrl = null;
  reimbursement.billFileId = null;
  await reimbursement.save();

  return res.status(200).json({
    success: true,
    message: "Bill deleted successfully",
    data: reimbursement,
    reimbursement
  });
});

module.exports = {
  applyReimbursement,
  getReimbursement,
  updateReimbursement,
  getAllReimbursement,
  updateBill,
  deleteBill
};
