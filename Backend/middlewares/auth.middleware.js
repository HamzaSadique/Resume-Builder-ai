import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Protect routes by verifying JWT access token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token from Header or Cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no access token provided");
  }

  try {
    // 2. Verify Token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Attach User to Request (exclude sensitive fields)
    const user = await User.findById(decoded.id || decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "User belonging to this token no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired. Please refresh your token or log in again.");
    }
    throw new ApiError(401, "Not authorized, token invalid or expired");
  }
});

/**
 * Restrict routes to specific user roles (e.g., 'admin')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role (${req.user?.role || "guest"}) is not authorized to access this resource`
      );
    }
    next();
  };
};