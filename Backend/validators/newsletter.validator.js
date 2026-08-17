import { z } from "zod";

export const subscribeNewsletterSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address"),
  }),
});

export const unsubscribeNewsletterSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required to unsubscribe" })
      .email("Please provide a valid email address"),
  }),
});