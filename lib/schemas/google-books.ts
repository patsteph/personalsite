import { z } from "zod";

// Schema for Google Books API query parameters
export const GoogleBooksQuerySchema = z
  .object({
    isbn: z
      .string()
      .regex(
        /^(?:97[89]-)?\d{1,5}-?\d{1,7}-?\d{1,7}-?[\dX]$/,
        "Invalid ISBN format",
      )
      .optional(),
    q: z
      .string()
      .min(1, "Search query cannot be empty")
      .max(200, "Search query is too long")
      .optional(),
    maxResults: z
      .string()
      .regex(/^\d+$/, "Max results must be a number")
      .refine((val) => {
        const num = parseInt(val);
        return num >= 1 && num <= 40;
      }, "Max results must be between 1 and 40")
      .optional(),
  })
  .refine(
    (data) => data.isbn || data.q,
    "Either ISBN or search query (q) must be provided",
  );

export type GoogleBooksQueryType = z.infer<typeof GoogleBooksQuerySchema>;

// Schema for mapped book data from Google Books API
export const GoogleBookSchema = z.object({
  googleBooksId: z.string(),
  title: z.string().optional(),
  authors: z.array(z.string()).optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  description: z.string().optional(),
  pageCount: z.number().optional(),
  categories: z.array(z.string()).optional(),
  averageRating: z.number().optional(),
  imageLinks: z
    .object({
      thumbnail: z.string().optional(),
      small: z.string().optional(),
      medium: z.string().optional(),
      large: z.string().optional(),
      extraLarge: z.string().optional(),
    })
    .optional(),
});

export type GoogleBookType = z.infer<typeof GoogleBookSchema>;

// Schema for Google Books API response
export const GoogleBooksResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(GoogleBookSchema).optional(),
  error: z.string().optional(),
});

export type GoogleBooksResponseType = z.infer<typeof GoogleBooksResponseSchema>;
