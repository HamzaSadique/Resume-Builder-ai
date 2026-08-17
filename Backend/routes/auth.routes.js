import { Router } from "express";
import {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  logoutUser,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { strictLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

// ==========================================
// PUBLIC AUTHENTICATION ROUTES
// ==========================================

// 1. Register User & Send OTP
router.post(
  "/register",
  strictLimiter,
  validateRequest(registerSchema),
  registerUser
);

// 2. Verify Email OTPss
router.post(
  "/verify-otp",
  strictLimiter,
  validateRequest(verifyOtpSchema),
  verifyOTP
);

// 3. Resend Verification OTP
router.post(
  "/resend-otp",
  strictLimiter,
  resendOTP
);

// 4. Login User
router.post(
  "/login",
  strictLimiter,
  validateRequest(loginSchema),
  loginUser
);

// 5. Request Password Reset Link
router.post(
  "/forgot-password",
  strictLimiter,
  validateRequest(forgotPasswordSchema),
  forgotPassword
);

// 6. Reset Password with Token Parameter
router.post(
  "/reset-password/:token",
  strictLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword
);

// ==========================================
// PROTECTED AUTHENTICATION ROUTES
// ==========================================

// 7. Logout User
router.post("/logout", protect, logoutUser);

export default router;