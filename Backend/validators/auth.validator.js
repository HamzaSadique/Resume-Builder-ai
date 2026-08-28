import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: "Full name is required" })
      .min(2, "Full name must be at least 2 characters long"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address format"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters long"),
    adminSecretKey: z
      .string()
      .optional(), // Optional secret key for admin creation
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address format"),
    password: z
      .string({ required_error: "Password is required" }),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address format"),
    otp: z
      .string({ required_error: "OTP is required" })
      .length(6, "OTP must be exactly 6 digits"),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address format"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address format"),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z
      .string({ required_error: "Reset token is required" }),
  }),
  body: z.object({
    password: z
      .string({ required_error: "New password is required" })
      .min(6, "Password must be at least 6 characters long"),
  }),
});