import { Router } from "express";
import passport from "passport";
import {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  googleCallbackHandler,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { strictLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

// ==========================================
// PUBLIC AUTH ROUTES (Password & Email)
// ==========================================

router.post(
  "/register",
  strictLimiter,
  validateRequest(registerSchema),
  registerUser
);

router.post(
  "/verify-otp",
  validateRequest(verifyOtpSchema),
  verifyOTP
);

router.post(
  "/resend-otp",
  strictLimiter,
  validateRequest(resendOtpSchema),
  resendOTP
);

router.post(
  "/login",
  strictLimiter,
  validateRequest(loginSchema),
  loginUser
);

router.post(
  "/forgot-password",
  strictLimiter,
  validateRequest(forgotPasswordSchema),
  forgotPassword
);

router.post(
  "/reset-password/:token",
  validateRequest(resetPasswordSchema),
  resetPassword
);

// ==========================================
// PASSPORT GOOGLE OAUTH ROUTES
// ==========================================

// 1. Redirect user to Google OAuth consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// 2. Google OAuth Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=google_failed`,
    session: false,
  }),
  googleCallbackHandler
);

// ==========================================
// PROTECTED AUTH ROUTES
// ==========================================

router.post("/logout", protect, logoutUser);

export default router;