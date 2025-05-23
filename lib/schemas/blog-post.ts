import { z } from "zod";

// Valid reaction types
export const ReactionTypeEnum = z.enum([
  "thumbsUp",
  "celebrate",
  "brain",
  "meh",
]);

// Valid actions for reactions
export const ReactionActionEnum = z.enum(["increment", "decrement", "visit"]);

// Base blog post reaction schema (without refine)
const BlogPostReactionBaseSchema = z.object({
  postId: z
    .string()
    .min(1, "Post ID is required")
    .max(100, "Post ID must be less than 100 characters")
    .regex(/^[a-zA-Z0-9-_]+$/, "Post ID contains invalid characters"),

  reaction: ReactionTypeEnum.optional(),

  action: ReactionActionEnum,

  previousReaction: ReactionTypeEnum.optional(),
});

// Blog post reaction schema with validation
export const BlogPostReactionSchema = BlogPostReactionBaseSchema.refine(
  (data) => {
    // If action is not 'visit', reaction is required
    if (data.action !== "visit" && !data.reaction) {
      return false;
    }
    return true;
  },
  {
    message: "Reaction is required for increment/decrement actions",
    path: ["reaction"],
  },
);

// Visit tracking schema (simplified)
export const VisitTrackingSchema = z.object({
  postId: z
    .string()
    .min(1, "Post ID is required")
    .max(100, "Post ID must be less than 100 characters"),

  action: z.literal("visit"),

  // Optional metadata for visit tracking
  referrer: z.string().url().optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.string().datetime().optional(),
});

// Combined schema for all blog post actions
export const BlogPostActionSchema = z.discriminatedUnion("action", [
  BlogPostReactionBaseSchema,
  VisitTrackingSchema,
]);

export type BlogPostReaction = z.infer<typeof BlogPostReactionSchema>;
export type VisitTracking = z.infer<typeof VisitTrackingSchema>;
export type BlogPostAction = z.infer<typeof BlogPostActionSchema>;
