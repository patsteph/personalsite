import { z } from "zod";

// Valid AI assistance tasks
export const AssistanceTaskEnum = z.enum([
  "improve",
  "summarize",
  "expand",
  "seo-optimize",
  "proofread",
  "translate",
  "generate-title",
  "generate-tags",
]);

// AI Blog Assistant request schema
export const BlogAssistantRequestSchema = z.object({
  task: AssistanceTaskEnum,

  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must be less than 10,000 characters"),

  options: z
    .object({
      targetLanguage: z.string().optional(),
      tone: z
        .enum(["professional", "casual", "academic", "creative"])
        .optional(),
      length: z.enum(["shorter", "same", "longer"]).optional(),
      keywords: z.array(z.string()).max(10).optional(),
    })
    .optional(),

  provider: z.enum(["openai", "anthropic", "gemini"]).optional(),

  temperature: z
    .number()
    .min(0, "Temperature must be between 0 and 1")
    .max(1, "Temperature must be between 0 and 1")
    .optional(),
});

// Book recommendation request schema
export const BookRecommendationRequestSchema = z.object({
  preferences: z.object({
    genres: z
      .array(z.string())
      .min(1, "At least one genre must be specified")
      .max(10, "Maximum 10 genres allowed"),

    authors: z.array(z.string()).max(10).optional(),

    readingLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),

    mood: z
      .enum(["light", "serious", "educational", "entertaining"])
      .optional(),

    length: z.enum(["short", "medium", "long", "any"]).optional(),

    published: z
      .object({
        after: z
          .number()
          .int()
          .min(1900)
          .max(new Date().getFullYear())
          .optional(),
        before: z
          .number()
          .int()
          .min(1900)
          .max(new Date().getFullYear())
          .optional(),
      })
      .optional(),

    excludeRead: z.array(z.string()).max(50).optional(),
  }),

  count: z
    .number()
    .int()
    .min(1, "Must request at least 1 recommendation")
    .max(20, "Maximum 20 recommendations allowed")
    .default(5),

  provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
});

export type AssistanceTask = z.infer<typeof AssistanceTaskEnum>;
export type BlogAssistantRequest = z.infer<typeof BlogAssistantRequestSchema>;
export type BookRecommendationRequest = z.infer<
  typeof BookRecommendationRequestSchema
>;
