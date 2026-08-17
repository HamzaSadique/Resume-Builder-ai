import { User } from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Get Current Logged-In User Profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return new ApiResponse(200, "User profile retrieved successfully", { user }).send(res);
});

/**
 * @desc    Update User Profile Details
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (fullName) user.fullName = fullName;

  const updatedUser = await user.save();

  return new ApiResponse(200, "Profile updated successfully", {
    user: updatedUser,
  }).send(res);
});

/**
 * @desc    Change Password for Logged-In User
 * @route   PATCH /api/users/change-password
 * @access  Private
 */
export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old password and new password are required");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Incorrect old password");
  }

  user.password = newPassword;
  await user.save();

  return new ApiResponse(200, "Password changed successfully").send(res);
});

/**
 * @desc    Delete Account
 * @route   DELETE /api/users/account
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return new ApiResponse(200, "Account deleted successfully").send(res);
});

/**
 * @desc    Get All Users (Admin Only)
 * @route   GET /api/users/admin/all
 * @access  Private/Admin
 */
export const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");

  return new ApiResponse(200, "All users retrieved successfully", {
    count: users.length,
    users,
  }).send(res);
});