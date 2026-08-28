import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters long")
      .max(50, "Full name cannot exceed 50 characters")
      .optional(),
    avatar: z
      .string()
      .url("Avatar must be a valid URL")
      .optional()
      .or(z.literal("")), // ✅ Allows empty string or ImageKit URL
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string({ required_error: "Old password is required" })
      .min(1, "Old password is required"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "New password must be at least 8 characters long")
      .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
      .regex(/[0-9]/, "New password must contain at least one number"),
  }),
});