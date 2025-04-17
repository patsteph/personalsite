/**
 * Blog API module
 * 
 * This module handles all blog-related interactions with Firebase
 */
// Blog API module (server-side only)
import { BlogPost } from '@/types/blog';
import { getCurrentUserToken } from './auth';

// Determine API base URL based on environment
const API_BASE = typeof window === 'undefined' 
  ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Server-side needs full URL
  : ''; // Client-side uses relative path starting with /api

/**
 * Convert Firestore document to BlogPost type
 */
// Convert API response to BlogPost type
function convertApiToBlogPost(data: any): BlogPost {
  return {
    id: data.id,
    title: data.title || '',
    slug: data.slug || '',
    summary: data.summary || '',
    content: data.content || '',
    author: data.author || '',
    coverImage: data.coverImage || '',
    tags: data.tags || [],
    published: data.published || false,
    publishedAt: data.publishedAt || null,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Get all published blog posts from API
 */
export async function getPublishedPosts(maxPosts?: number): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${API_BASE}/api/blog?published=true${maxPosts ? `&limit=${maxPosts}` : ''}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(convertApiToBlogPost);
      }
    }
    throw new Error('API did not return success');
  } catch (error) {
    console.error('Error fetching published blog posts from API:', error);
    return [];
  }
}

/**
 * Get all blog posts (including unpublished) from API
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const token = await getCurrentUserToken();
    const response = await fetch(`${API_BASE}/api/blog?admin=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(convertApiToBlogPost);
      }
    }
    throw new Error('API did not return success');
  } catch (error) {
    console.error('Error fetching all blog posts from API:', error);
    return [];
  }
}

/**
 * Get blog post by slug from API
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${API_BASE}/api/blog?slug=${slug}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return convertApiToBlogPost(data.data);
      }
    }
    throw new Error('API did not return success');
  } catch (error) {
    console.error('Error fetching blog post by slug from API:', error);
    return null;
  }
}

/**
 * Add new blog post via API
 */
export async function addBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost | null> {
  try {
    const token = await getCurrentUserToken();
    const response = await fetch(`${API_BASE}/api/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(post)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return convertApiToBlogPost(data.data);
      }
    }
    throw new Error('API did not return success');
  } catch (error) {
    console.error('Error adding blog post via API:', error);
    return null;
  }
}

/**
 * Update existing blog post via API
 */
export async function updateBlogPost(id: string, post: Partial<BlogPost>): Promise<boolean> {
  try {
    const token = await getCurrentUserToken();
    const response = await fetch(`${API_BASE}/api/blog?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(post)
    });
    if (response.ok) {
      const data = await response.json();
      return !!data.success;
    }
    throw new Error('API did not return success');
  } catch (error) {
    console.error('Error updating blog post via API:', error);
    return false;
  }
}

/**
 * Delete blog post via API
 */
export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    const token = await getCurrentUserToken();
    const response = await fetch(`${API_BASE}/api/blog?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (response.ok) {
      const data = await response.json();
      return !!data.success;
    }
    throw new Error('API did not return success');
  } catch (error) {
    console.error('Error deleting blog post via API:', error);
    return false;
  }
}

/**
 * Get posts by tag from API
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${API_BASE}/api/blog?tag=${tag}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(convertApiToBlogPost);
      }
    }
    throw new Error('API did not return success');
  } catch (error) {
    console.error('Error fetching posts by tag from API:', error);
    return [];
  }
}