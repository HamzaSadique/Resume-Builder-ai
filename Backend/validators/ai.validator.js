import { z } from "zod";

export const generateSummarySchema = z.object({
  body: z.object({
    jobTitle: z
      .string({ required_error: "Job title is required" })
      .min(2, "Job title must be at least 2 characters long"),
    experienceLevel: z
      .enum(["entry", "intermediate", "senior", "executive"])
      .optional(),
    keySkills: z.array(z.string()).optional(),
  }),
});

export const enhanceBulletSchema = z.object({
  body: z.object({
    rawBullet: z
      .string({ required_error: "Bullet point text is required" })
      .min(5, "Bullet point text must be at least 5 characters long"),
  }),
});

export const atsScoreSchema = z.object({
  body: z.object({
    resumeText: z
      .string({ required_error: "Resume text is required" })
      .min(20, "Resume text must be detailed enough for analysis"),
    jobDescription: z
      .string({ required_error: "Job description is required" })
      .min(20, "Job description must be detailed enough for comparison"),
  }),
});