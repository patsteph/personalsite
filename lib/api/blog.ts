/**
 * Blog API module
 * 
 * This module handles all blog-related interactions with Firebase
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { Firestore } from 'firebase/firestore';
import { BlogPost } from '@/types/blog';
import { getCurrentUserToken } from './auth';

// Firestore collection name
const COLLECTION_NAME = 'blog-posts';
const API_BASE = '/api';

/**
 * Convert Firestore document to BlogPost type
 */
function convertDocToBlogPost(doc: QueryDocumentSnapshot<DocumentData>): BlogPost {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || '',
    slug: data.slug || '',
    summary: data.summary || '',
    content: data.content || '',
    author: data.author || '',
    coverImage: data.coverImage || '',
    tags: data.tags || [],
    published: data.published || false,
    publishedAt: data.publishedAt?.toDate() || null,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

/**
 * Get all published blog posts - tries server API first, falls back to client
 */
export async function getPublishedPosts(maxPosts?: number): Promise<BlogPost[]> {
  try {
    // Try server API first
    try {
      const limitParam = maxPosts ? `?limit=${maxPosts}` : '';
      const response = await fetch(`${API_BASE}/blog${limitParam}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : [];
      }
      // If server API fails, log error and continue with client-side fallback
      console.warn('Server API failed, falling back to client-side API');
    } catch (serverError) {
      console.error('Server API error, falling back to client-side:', serverError);
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, returning empty posts array');
      return [];
    }

    let blogQuery = query(
      collection(firestore as Firestore, COLLECTION_NAME),
      where('published', '==', true),
      orderBy('publishedAt', 'desc')
    );
    
    if (maxPosts) {
      blogQuery = query(blogQuery, limit(maxPosts));
    }
    
    const querySnapshot = await getDocs(blogQuery);
    return querySnapshot.docs.map(convertDocToBlogPost);
  } catch (error) {
    console.error('API: Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Get all blog posts (including unpublished) - tries server API first, falls back to client
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/blog?admin=true`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : [];
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, returning empty posts array');
      return [];
    }

    const blogQuery = query(
      collection(firestore as Firestore, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(blogQuery);
    return querySnapshot.docs.map(convertDocToBlogPost);
  } catch (error) {
    console.error('API: Error fetching all blog posts:', error);
    return [];
  }
}

/**
 * Get blog post by slug - tries server API first, falls back to client
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    // Try server API first
    try {
      const response = await fetch(`${API_BASE}/blog?slug=${slug}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
      // If server API fails, log error and continue with client-side fallback
      console.warn('Server API failed, falling back to client-side API');
    } catch (serverError) {
      console.error('Server API error, falling back to client-side:', serverError);
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, returning null for post slug');
      return null;
    }

    const blogQuery = query(
      collection(firestore as Firestore, COLLECTION_NAME),
      where('slug', '==', slug)
    );
    
    const querySnapshot = await getDocs(blogQuery);
    
    if (querySnapshot.docs.length === 0) {
      return null;
    }
    
    return convertDocToBlogPost(querySnapshot.docs[0]);
  } catch (error) {
    console.error(`API: Error fetching blog post with slug ${slug}:`, error);
    return null;
  }
}

/**
 * Add new blog post - tries server API first, falls back to client
 */
export async function addBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost | null> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/blog`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(post)
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : null;
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    const now = new Date();
    
    const postData = {
      ...post,
      publishedAt: post.published ? (post.publishedAt || now) : null,
      createdAt: now,
      updatedAt: now
    };
    
    if (!firestore) {
      console.warn('Firestore not initialized, cannot add blog post');
      return null;
    }

    const docRef = await addDoc(collection(firestore as Firestore, COLLECTION_NAME), postData);
    
    return {
      ...post,
      id: docRef.id,
      publishedAt: postData.publishedAt,
      createdAt: postData.createdAt,
      updatedAt: postData.updatedAt
    };
  } catch (error) {
    console.error('API: Error adding blog post:', error);
    return null;
  }
}

/**
 * Update existing blog post - tries server API first, falls back to client
 */
export async function updateBlogPost(id: string, post: Partial<BlogPost>): Promise<boolean> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/blog?id=${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(post)
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success;
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    const now = new Date();
    
    const postData = {
      ...post,
      // Update publishedAt if post is being published for the first time
      ...(post.published && !post.publishedAt ? { publishedAt: now } : {}),
      updatedAt: now
    };
    
    if (!firestore) {
      console.warn('Firestore not initialized, cannot update blog post');
      return false;
    }

    const docRef = doc(firestore as Firestore, COLLECTION_NAME, id);
    await updateDoc(docRef, postData);
    
    return true;
  } catch (error) {
    console.error(`API: Error updating blog post with ID ${id}:`, error);
    return false;
  }
}

/**
 * Delete blog post - tries server API first, falls back to client
 */
export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/blog?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success;
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, cannot delete blog post');
      return false;
    }

    const docRef = doc(firestore as Firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error(`API: Error deleting blog post with ID ${id}:`, error);
    return false;
  }
}

/**
 * Get posts by tag - tries server API first, falls back to client
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    // Try server API first
    try {
      const response = await fetch(`${API_BASE}/blog?tag=${tag}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : [];
      }
      // If server API fails, log error and continue with client-side fallback
      console.warn('Server API failed, falling back to client-side API');
    } catch (serverError) {
      console.error('Server API error, falling back to client-side:', serverError);
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, returning empty posts array for tag');
      return [];
    }

    const blogQuery = query(
      collection(firestore as Firestore, COLLECTION_NAME),
      where('published', '==', true),
      where('tags', 'array-contains', tag),
      orderBy('publishedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(blogQuery);
    return querySnapshot.docs.map(convertDocToBlogPost);
  } catch (error) {
    console.error(`API: Error fetching blog posts with tag ${tag}:`, error);
    return [];
  }
}