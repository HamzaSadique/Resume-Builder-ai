import { z } from "zod";

export const saveInterviewSchema = z.object({
  body: z.object({
    topic: z
      .string({ required_error: "Topic is required" })
      .min(2, "Topic must be at least 2 characters")
      .max(100, "Topic must not exceed 100 characters"),

    transcript: z
      .array(
        z.object({
          sender: z.enum(["user", "ai"], {
            required_error: "Sender is required",
            invalid_type_error: "Sender must be 'user' or 'ai'",
          }),
          text: z
            .string({ required_error: "Text is required" })
            .min(1, "Text cannot be empty"),
        })
      )
      .min(1, "Transcript must contain at least one message"),
  }),
});