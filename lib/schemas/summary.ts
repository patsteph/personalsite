import { z } from "zod";

// Schema for AI summary generation requests
export const SummaryRequestSchema = z.object({
  postId: z
    .string()
    .min(1, "Post ID is required")
    .max(128, "Post ID is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Post ID contains invalid characters"),
  content: z
    .string()
    .min(
      50,
      "Content must be at least 50 characters long for meaningful summary",
    )
    .max(50000, "Content is too long for processing")
    .refine(
      (content) => content.trim().length > 0,
      "Content cannot be empty or whitespace only",
    ),
});

export type SummaryRequestType = z.infer<typeof SummaryRequestSchema>;

// Schema for AI summary response
export const SummaryResponseSchema = z.object({
  success: z.boolean(),
  summary: z.string().optional(),
  error: z.string().optional(),
  details: z.any().optional(),
});

export type SummaryResponseType = z.infer<typeof SummaryResponseSchema>;
