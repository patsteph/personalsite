import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BlogPost } from '@/types/blog';

// Directory for blog posts
const postsDirectory = path.join(process.cwd(), 'content/blog');

/**
 * Get all blog posts, sorted by date
 */
export function getAllPosts(): BlogPost[] {
  // Ensure the posts directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  
  // Get all the files in the posts directory
  const fileNames = fs.readdirSync(postsDirectory);
  
  const posts = fileNames
    .filter(fileName => fileName.endsWith('.md')) // Only include markdown files
    .map(fileName => {
      // Remove ".md" from file name to get slug
      const slug = fileName.replace(/\.md$/, '');
      
      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      // Use gray-matter to parse the post metadata section
      const { data, content } = matter(fileContents);
      
      // Estimate reading time (words per minute)
      const wordsPerMinute = 200;
      const wordCount = content.split(/\s+/g).length;
      const readingTime = Math.ceil(wordCount / wordsPerMinute);
      
      // Combine the data with the slug
      return {
        slug,
        title: data.title,
        date: data.date,
        summary: data.summary,
        content,
        readingTime
      } as BlogPost;
    })
    // Sort posts by date in descending order
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return posts;
}

/**
 * Get recent blog posts
 */
export function getRecentPosts(count: number = 3): BlogPost[] {
  return getAllPosts().slice(0, count);
}

/**
 * Get a specific blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    
    // Check if the file exists
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // Estimate reading time
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/g).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    
    return {
      slug,
      title: data.title,
      date: data.date,
      summary: data.summary,
      content,
      readingTime
    } as BlogPost;
  } catch (error) {
    console.error(`Error fetching post ${slug}:`, error);
    return null;
  }
}

/**
 * Get all post slugs for static path generation
 * This is the function that was missing!
 */
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => fileName.replace(/\.md$/, ''));
}