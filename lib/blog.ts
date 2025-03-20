/**
 * Blog module - Re-exports functions from the API layer for backward compatibility
 */
import { blog as blogApi } from './api';
import { BlogPost } from '@/types/blog';

// Re-export all functions from blog API
export const getPublishedPosts = blogApi.getPublishedPosts;
export const getAllPosts = blogApi.getAllPosts;
export const getPostBySlug = blogApi.getPostBySlug;
export const addBlogPost = blogApi.addBlogPost;
export const updateBlogPost = blogApi.updateBlogPost;
export const deleteBlogPost = blogApi.deleteBlogPost;
export const getPostsByTag = blogApi.getPostsByTag;

// Function to get recent posts
export const getRecentPosts = async (count: number = 3): Promise<BlogPost[]> => {
  return blogApi.getPublishedPosts(count);
};

// Get all post slugs for static generation
export const getAllPostSlugs = async (): Promise<string[]> => {
  try {
    const posts = await getAllPosts();
    return posts.map(post => post.slug);
  } catch (error) {
    console.error('Error getting all post slugs:', error);
    return [];
  }
};