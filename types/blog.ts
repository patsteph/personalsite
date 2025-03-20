export type BlogPost = {
  id?: string;
  slug: string;
  title: string;
  date?: string;
  summary: string;
  content: string;
  author?: string;
  coverImage?: string;
  tags?: string[];
  published?: boolean;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  readingTime?: number;
}