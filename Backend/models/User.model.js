import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password required ONLY if user is not signing in with Google
      },
      select: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: "",
      select: false,
    },

    // OTP Verification
    emailOtp: {
      type: String,
      select: false,
    },
    emailOtpExpires: {
      type: Date,
      select: false,
    },

    // Password Reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Monetization & Limits
    plan: {
      type: String,
      enum: ["free", "pro", "lifetime"],
      default: "free",
    },
    atsScansRemaining: {
      type: Number,
      default: 3,
    },
    freeExportUsed: {
      type: Boolean,
      default: false,
    },
    aiCredits: {
      type: Number,
      default: 10,
    },
    purchasedTemplates: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare input password with hashed password
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate 6-digit Email OTP and hash it
userSchema.methods.generateEmailOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailOtp = crypto.createHash("sha256").update(otp).digest("hex");
  this.emailOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Generate Password Reset Token and hash it
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

export const User = mongoose.model("User", userSchema);