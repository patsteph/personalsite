import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from '@/lib/firebase-admin';

type BlogResponse = {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BlogResponse>
) {
  // Log request for debugging
  console.log('Blog API received', req.method, 'request', 
    req.query ? `with query: ${JSON.stringify(req.query)}` : '');
  
  // For GET requests on published posts, no auth required
  if (req.method === 'GET' && !req.query.admin) {
    return handlePublicGet(req, res);
  }
  
  // For all other requests, verify authentication
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Blog API: Missing or invalid authorization header');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    try {
      await auth.verifyIdToken(token);
      console.log('Blog API: Authentication successful');
    } catch (authError: any) {
      console.error('Blog API: Token verification failed:', authError);
      return res.status(401).json({ success: false, error: 'Invalid authentication token' });
    }
  } catch (error: any) {
    console.error('Blog API auth error:', error);
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  // Handle authenticated requests
  const postsCollection = firestore.collection('blog-posts');
  
  // GET - Get all blog posts (including unpublished, admin-only)
  if (req.method === 'GET' && req.query.admin) {
    try {
      const snapshot = await postsCollection.orderBy('createdAt', 'desc').get();
      const posts: any[] = [];
      
      snapshot.forEach(doc => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(200).json({ success: true, data: posts });
    } catch (error: any) {
      console.error('API error getting all blog posts:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // POST - Create a new blog post
  if (req.method === 'POST') {
    try {
      const now = new Date();
      const postData = {
        ...req.body,
        createdAt: now,
        updatedAt: now,
        publishedAt: req.body.published ? (req.body.publishedAt || now) : null
      };
      
      const docRef = await postsCollection.add(postData);
      
      return res.status(201).json({
        success: true,
        data: {
          id: docRef.id,
          ...postData
        }
      });
    } catch (error: any) {
      console.error('API error creating blog post:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // PUT - Update a blog post
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Blog post ID is required' });
      }
      
      const now = new Date();
      const postData = {
        ...req.body,
        updatedAt: now,
        // Update publishedAt if post is being published for the first time
        ...(req.body.published && !req.body.publishedAt ? { publishedAt: now } : {})
      };
      
      await postsCollection.doc(id).update(postData);
      
      return res.status(200).json({
        success: true,
        data: {
          id,
          ...postData
        }
      });
    } catch (error: any) {
      console.error('API error updating blog post:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // DELETE - Delete a blog post
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Blog post ID is required' });
      }
      
      await postsCollection.doc(id).delete();
      
      return res.status(200).json({ 
        success: true, 
        data: { message: 'Blog post deleted successfully' }
      });
    } catch (error: any) {
      console.error('API error deleting blog post:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

// Handler for public GET requests (no auth required)
async function handlePublicGet(
  req: NextApiRequest,
  res: NextApiResponse<BlogResponse>
) {
  const postsCollection = firestore.collection('blog-posts');
  
  try {
    const { slug, tag, limit: limitParam } = req.query;
    
    // Get a specific post by slug
    if (slug && typeof slug === 'string') {
      console.log(`API (handlePublicGet): Fetching post with slug "${slug}"`);
      
      // If we're looking for a slug, don't restrict to only published posts
      // This will help with debugging in development environment
      const postQuery = postsCollection.where('slug', '==', slug);
      
      console.log(`API (handlePublicGet): Executing Firestore query for slug "${slug}"`);
      const snapshot = await postQuery.get();
      console.log(`API (handlePublicGet): Query returned ${snapshot.size} documents`);
      
      if (snapshot.empty) {
        console.warn(`API (handlePublicGet): No post found with slug "${slug}"`);
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
      
      const doc = snapshot.docs[0];
      const postData = {
        id: doc.id,
        ...doc.data()
      };
      
      console.log(`API (handlePublicGet): Successfully found post with slug "${slug}", post ID: ${doc.id}`);
      
      return res.status(200).json({
        success: true,
        data: postData
      });
    }
    
    // Get posts by tag
    if (tag && typeof tag === 'string') {
      const snapshot = await postsCollection
        .where('tags', 'array-contains', tag)
        .where('published', '==', true)
        .orderBy('publishedAt', 'desc')
        .get();
      
      const posts: any[] = [];
      snapshot.forEach(doc => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(200).json({ success: true, data: posts });
    }
    
    // Get all published posts with optional limit
    let query = postsCollection
      .where('published', '==', true)
      .orderBy('publishedAt', 'desc');
    
    // Apply limit if provided
    if (limitParam && typeof limitParam === 'string') {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        query = query.limit(limit);
      }
    }
    
    const snapshot = await query.get();
    const posts: any[] = [];
    
    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ success: true, data: posts });
  } catch (error: any) {
    console.error('API error getting published blog posts:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}