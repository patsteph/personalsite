export type ReactionType = 'thumbsUp' | 'celebrate' | 'brain' | 'meh';

export interface Reactions {
  thumbsUp: number;
  celebrate: number;
  brain: number;
  meh: number;
  total?: number;
}

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
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  readingTime?: number;
  reactions?: Reactions;
  visits?: number;
}