/**
 * Blog API module
 *
 * This module handles all blog-related interactions with Firebase
 */
// Blog API module (server-side only)
import { BlogPost } from "@/types/blog";
// Import Firebase auth instance and token function
import { auth } from "../firebase-client";
import { getIdToken } from "firebase/auth";

// Determine API base URL based on environment
const API_BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" // Server-side needs full URL
    : ""; // Client-side uses relative path starting with /api

/**
 * Convert Firestore document to BlogPost type
 */
// Convert API response to BlogPost type
function convertApiToBlogPost(data: any): BlogPost {
  // Calculate reading time if not provided (rough estimate: 200 words per minute)
  let readingTime = data.readingTime;
  if (!readingTime && data.content) {
    const wordCount = data.content.trim().split(/\s+/).length;
    readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  return {
    id: data.id,
    title: data.title || "",
    slug: data.slug || "",
    summary: data.summary || "",
    content: data.content || "",
    author: data.author || "",
    coverImage: data.coverImage || "",
    tags: data.tags || [],
    published: data.published || false,
    publishedAt: data.publishedAt || null,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    readingTime: readingTime || 1, // Default to 1 minute if calculation fails
  };
}

/**
 * Get all published blog posts from API
 */
export async function getPublishedPosts(
  maxPosts?: number,
): Promise<BlogPost[]> {
  try {
    const response = await fetch(
      `${API_BASE}/api/blog?published=true${maxPosts ? `&limit=${maxPosts}` : ""}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(convertApiToBlogPost);
      }
    }
    throw new Error("API did not return success");
  } catch (error) {
    console.error("Error fetching published blog posts from API:", error);
    return [];
  }
}

/**
 * Get all blog posts (including unpublished) from API
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    // Get auth token if available using Firebase SDK
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.warn("Failed to get ID token for getAllPosts:", error);
      }
    }

    // If no token, likely shouldn't be calling this admin=true endpoint
    if (!token) {
      console.warn(
        "getAllPosts requires authentication, but no user token found.",
      );
      return []; // Or throw an error?
    }

    const response = await fetch(`${API_BASE}/api/blog?admin=true`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(convertApiToBlogPost);
      }
    }
    throw new Error("API did not return success");
  } catch (error) {
    console.error("Error fetching all blog posts from API:", error);
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
    throw new Error("API did not return success");
  } catch (error) {
    console.error("Error fetching blog post by slug from API:", error);
    return null;
  }
}

/**
 * Add new blog post via API
 */
export async function addBlogPost(
  post: Omit<BlogPost, "id" | "createdAt" | "updatedAt">,
): Promise<BlogPost | null> {
  console.log("addBlogPost: Starting with post data:", post);

  try {
    // Get auth token - required for adding posts using Firebase SDK
    let token: string | null = null;
    if (auth?.currentUser) {
      console.log("addBlogPost: Auth user found, getting ID token");
      try {
        token = await auth.currentUser.getIdToken(true);
        console.log("addBlogPost: ID token obtained successfully");
      } catch (error) {
        console.error("addBlogPost: Failed to get ID token:", error);
      }
    } else {
      console.log("addBlogPost: No auth user found");
    }

    if (!token) {
      console.error("addBlogPost: No authentication token available");
      throw new Error("Authentication required to add blog posts");
    }

    console.log("addBlogPost: Making POST request to /api/blog");
    const response = await fetch(`${API_BASE}/api/blog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Token is guaranteed here
      },
      body: JSON.stringify(post),
    });

    console.log("addBlogPost: Response status:", response.status);
    console.log("addBlogPost: Response ok:", response.ok);

    const data = await response.json();
    console.log("addBlogPost: Response data:", data);

    if (response.ok) {
      if (data.success && data.data) {
        console.log("addBlogPost: Success, returning converted blog post");
        return convertApiToBlogPost(data.data);
      } else {
        console.error(
          "addBlogPost: API returned ok but data structure invalid:",
          data,
        );
      }
    } else {
      console.error(
        "addBlogPost: Response not ok, status:",
        response.status,
        "data:",
        data,
      );
    }

    throw new Error(`API error: ${data.error || "Unknown error"}`);
  } catch (error) {
    console.error("addBlogPost: Error adding blog post via API:", error);
    return null;
  }
}

/**
 * Update existing blog post via API
 */
export async function updateBlogPost(
  id: string,
  post: Partial<BlogPost>,
): Promise<boolean> {
  try {
    // Get auth token - required for updating posts using Firebase SDK
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error("Failed to get ID token for updateBlogPost:", error);
      }
    }

    if (!token) {
      throw new Error("Authentication required to update blog posts");
    }

    const response = await fetch(`${API_BASE}/api/blog?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Token is guaranteed here
      },
      body: JSON.stringify(post),
    });
    if (response.ok) {
      const data = await response.json();
      return !!data.success;
    }
    throw new Error("API did not return success");
  } catch (error) {
    console.error("Error updating blog post via API:", error);
    return false;
  }
}

/**
 * Delete blog post via API
 */
export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    // Get auth token - required for deleting posts using Firebase SDK
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error("Failed to get ID token for deleteBlogPost:", error);
      }
    }

    if (!token) {
      throw new Error("Authentication required to delete blog posts");
    }

    const response = await fetch(`${API_BASE}/api/blog?id=${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Token is guaranteed here
      },
    });
    if (response.ok) {
      const data = await response.json();
      return !!data.success;
    }
    throw new Error("API did not return success");
  } catch (error) {
    console.error("Error deleting blog post via API:", error);
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
    throw new Error("API did not return success");
  } catch (error) {
    console.error("Error fetching posts by tag from API:", error);
    return [];
  }
}
