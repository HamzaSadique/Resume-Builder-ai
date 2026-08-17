import rateLimit from "express-rate-limit";
import ApiError from "../utils/ApiError.js";

/**
 * Global API rate limit
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many requests from this IP. Please try again after 15 minutes."));
  },
});

/**
 * Strict Rate Limiter for Auth, OTP, and AI Generation endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 requests per 15 minutes (e.g., OTP attempts or logins)
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many sensitive attempts. Please wait 15 minutes before trying again."));
  },
});