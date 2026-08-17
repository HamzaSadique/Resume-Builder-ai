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
      required: [true, "Password is required"],
      select: false, // Prevents password leak in query projections
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

    // Monetization, Free Tier & Access Limits
    plan: {
      type: String,
      enum: ["free", "pro", "lifetime"],
      default: "free",
    },
    atsScansRemaining: {
      type: Number,
      default: 3, // 3 Free ATS Scans limit
    },
    freeExportUsed: {
      type: Boolean,
      default: false, // 1 Free Ready Resume Download
    },
    aiCredits: {
      type: Number,
      default: 10, // Initial free AI rewriter tokens
    },
    purchasedTemplates: [
      {
        type: String, // Unlocked premium template IDs
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare input password with hashed password
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate 6-digit Email OTP and hash it
userSchema.methods.generateEmailOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  
  // Store hashed OTP in database for security
  this.emailOtp = crypto.createHash("sha256").update(otp).digest("hex");
  this.emailOtpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

  return otp; // Return unhashed OTP to send via email
};

// Generate Password Reset Token and hash it
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store hashed token in database
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // Expires in 15 minutes

  return resetToken; // Return unhashed token to construct reset URL
};

export const User = mongoose.model("User", userSchema);