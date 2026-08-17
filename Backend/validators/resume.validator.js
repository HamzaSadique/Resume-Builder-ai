import { z } from "zod";

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Mongo ID format");

export const createResumeSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").optional(),
    templateId: z.string().optional(),
    themeColor: z.string().optional(),
    fontStyle: z.string().optional(),
    personalInfo: z.record(z.any()).optional(),
    summary: z.string().optional(),
    experience: z.array(z.record(z.any())).optional(),
    education: z.array(z.record(z.any())).optional(),
    skills: z.array(z.union([z.string(), z.record(z.any())])).optional(),
    projects: z.array(z.record(z.any())).optional(),
    certifications: z.array(z.record(z.any())).optional(),
    languages: z.array(z.record(z.any())).optional(),
    customSections: z.array(z.record(z.any())).optional(),
  }),
});

export const updateResumeSchema = createResumeSchema;

export const resumeIdParamSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
});