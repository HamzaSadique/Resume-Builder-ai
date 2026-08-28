import { User } from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Get Current Logged-In User Profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User profile retrieved successfully"));
});

/**
 * @desc    Update User Profile Details (fullName & ImageKit avatar URL)
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (avatar !== undefined) user.avatar = avatar; // ✅ Added ImageKit URL handling

  const updatedUser = await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: updatedUser }, "Profile updated successfully")
    );
});

/**
 * @desc    Change Password for Logged-In User
 * @route   PATCH /api/v1/users/change-password
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

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * @desc    Delete Account
 * @route   DELETE /api/v1/users/account
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Account deleted successfully"));
});

/**
 * @desc    Get All Users (Admin Only)
 * @route   GET /api/v1/users/admin/all
 * @access  Private/Admin
 */
export const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");

  return res.status(200).json(
    new ApiResponse(
      200,
      { count: users.length, users },
      "All users retrieved successfully"
    )
  );
});