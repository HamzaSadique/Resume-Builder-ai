import crypto from "crypto";
import bcrypt from "bcryptjs";
import Otp from "../models/Otp.model.js";
import ApiError from "./ApiError.js";

/**
 * Generate a 6-digit random OTP, hash it, and store it in the DB with expiration
 */
export const generateAndSaveOtp = async (email, purpose = "email_verification") => {
  // 1. Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // 2. Hash the OTP for secure database storage
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  // 3. Remove old unverified OTPs for the same email and purpose
  await Otp.deleteMany({ email, purpose });

  // 4. Save new hashed OTP (Expires in 10 minutes by default)
  await Otp.create({
    email,
    otp: hashedOtp,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  return otp; // Return plain OTP to send via Email
};

/**
 * Verify provided OTP against stored hash
 */
export const verifyOtpCode = async (email, inputOtp, purpose = "email_verification") => {
  const record = await Otp.findOne({ email, purpose });

  if (!record) {
    throw new ApiError(400, "OTP has expired or does not exist. Please request a new one.");
  }

  // Check if OTP has expired
  if (new Date() > record.expiresAt) {
    await record.deleteOne();
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  // Compare input OTP with stored hash
  const isMatch = await bcrypt.compare(inputOtp, record.otp);

  if (!isMatch) {
    throw new ApiError(400, "Invalid OTP code provided.");
  }

  // Clean up OTP record once verified
  await record.deleteOne();
  return true;
};