import { z } from "zod";

export const updateUserAdminSchema = z.object({
  params: z.object({
    userId: z.string({ required_error: "User ID is required" }),
  }),
  body: z.object({
    role: z.enum(["user", "admin"]).optional(),
    plan: z.enum(["free", "pro", "lifetime"]).optional(),
    aiCredits: z.number().min(0).optional(),
    atsScansRemaining: z.number().min(0).optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string({ required_error: "User ID is required" }),
  }),
});