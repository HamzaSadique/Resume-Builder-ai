import User from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ==========================================
// USER MANAGEMENT
// ==========================================

// Get all registered users (paginated)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = search
    ? {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(query)
    .select("-password -refreshToken")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const count = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page),
        totalUsers: count,
      },
      "Users retrieved successfully"
    )
  );
});

// Update user credits, plan, or role manually
export const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role, plan, aiCredits, atsScansRemaining } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (role) user.role = role;
  if (plan) user.plan = plan;
  if (aiCredits !== undefined) user.aiCredits = aiCredits;
  if (atsScansRemaining !== undefined) user.atsScansRemaining = atsScansRemaining;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully by admin"));
});

// Delete user account
export const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User account deleted successfully"));
});

// ==========================================
// DASHBOARD METRICS & TRANSACTIONS
// ==========================================

// Get Admin Dashboard Overview stats
export const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalAdmins = await User.countDocuments({ role: "admin" });
  const proPlanUsers = await User.countDocuments({ plan: { $ne: "free" } });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalAdmins,
        proPlanUsers,
      },
      "Admin statistics retrieved successfully"
    )
  );
});