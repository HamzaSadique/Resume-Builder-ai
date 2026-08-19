import { User } from "../models/User.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

// Helper function to generate tokens
const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

// 1. Handles redirect after successful Google OAuth authentication
export const googleCallbackHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Google Authentication failed");
  }

  const user = req.user;
  const { accessToken, refreshToken } = await generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions);

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return res.redirect(`${clientUrl}/auth/success?token=${accessToken}`);
});

// 2. Register User (Standard)
export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User with this email already exists");
  }

  const user = new User({ fullName, email, password });
  const otp = user.generateEmailOTP();
  await user.save();

  await sendEmail({
    email: user.email,
    subject: "Verify Your Email - OTP",
    message: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      { email: user.email },
      "Registration successful. Verification OTP sent to email."
    )
  );
});

// 3. Verify Email OTP
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email,
    emailOtp: hashedOtp,
    emailOtpExpires: { $gt: Date.now() },
  }).select("+emailOtp +emailOtpExpires");

  if (!user) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerified = true;
  user.emailOtp = undefined;
  user.emailOtpExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully"));
});

// 4. Resend OTP
export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "This email is already verified");
  }

  const otp = user.generateEmailOTP();
  await user.save();

  await sendEmail({
    email: user.email,
    subject: "New Verification OTP",
    message: `Your new verification code is: ${otp}. Expires in 10 minutes.`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "New OTP sent to email"));
});

// 5. Login User
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Please verify your email address before logging in"
    );
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            plan: user.plan,
            atsScansRemaining: user.atsScansRemaining,
            aiCredits: user.aiCredits,
          },
          accessToken,
        },
        "Login successful"
      )
    );
});

// 6. Logout User
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: "" } });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// 7. Forgot Password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await sendEmail({
    email: user.email,
    subject: "Password Reset Request",
    message: `Reset your password by clicking this link: ${resetUrl}\n\nLink expires in 15 minutes.`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset link sent to email"));
});

// 8. Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "New password is required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset successful. You can now log in."
      )
    );
});