import { z } from "zod";

export const uploadDocumentSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .optional(),
    category: z
      .enum(["resume", "certificate", "other"])
      .optional(),
  }),
});