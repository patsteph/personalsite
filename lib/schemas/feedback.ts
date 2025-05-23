import { z } from "zod";

export const FeedbackSchema = z.object({
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s-_]+$/, "Category contains invalid characters"),

  feedback: z
    .string()
    .min(10, "Feedback must be at least 10 characters")
    .max(2000, "Feedback must be less than 2000 characters"),

  page: z
    .string()
    .max(200, "Page URL must be less than 200 characters")
    .optional()
    .default("/"),

  timestamp: z.string().datetime().optional(),

  sessionId: z.string().max(100, "Session ID too long").optional(),

  referrer: z.string().max(500, "Referrer URL too long").optional().nullable(),

  userAgent: z.string().max(500, "User Agent too long").optional().nullable(),
});

export type FeedbackData = z.infer<typeof FeedbackSchema>;
