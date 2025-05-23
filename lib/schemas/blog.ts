import { z } from "zod";

// Blog post validation schema
export const BlogPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),

  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .trim(),

  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(50000, "Content must be less than 50,000 characters"),

  excerpt: z
    .string()
    .max(500, "Excerpt must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(30, "Tag must be less than 30 characters")
        .regex(
          /^[a-zA-Z0-9\s-]+$/,
          "Tags can only contain letters, numbers, spaces, and hyphens",
        ),
    )
    .max(10, "Maximum 10 tags allowed")
    .optional()
    .default([]),

  published: z.boolean().default(false),

  featured: z.boolean().optional().default(false),

  author: z
    .string()
    .min(1, "Author is required")
    .max(100, "Author name must be less than 100 characters")
    .optional(),

  metaDescription: z
    .string()
    .max(160, "Meta description must be less than 160 characters")
    .optional()
    .or(z.literal("")),

  readingTime: z
    .number()
    .int()
    .min(1, "Reading time must be at least 1 minute")
    .max(120, "Reading time must be less than 120 minutes")
    .optional(),

  categoryId: z
    .string()
    .max(50, "Category ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  // Dates handled by server, but validate if provided
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
});

// Schema for blog post updates (all fields optional except content validation)
export const BlogPostUpdateSchema = BlogPostSchema.partial().extend({
  // Still require minimum content length if content is being updated
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(50000, "Content must be less than 50,000 characters")
    .optional(),
});

// Schema for blog post creation (stricter requirements)
export const BlogPostCreateSchema = BlogPostSchema.pick({
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  tags: true,
  published: true,
  featured: true,
  author: true,
  metaDescription: true,
  readingTime: true,
  categoryId: true,
});

export type BlogPost = z.infer<typeof BlogPostSchema>;
export type BlogPostCreate = z.infer<typeof BlogPostCreateSchema>;
export type BlogPostUpdate = z.infer<typeof BlogPostUpdateSchema>;
