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
  // For GET requests on published posts, no auth required
  if (req.method === 'GET' && !req.query.admin) {
    return handlePublicGet(req, res);
  }
  
  // For all other requests, verify authentication
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    await auth.verifyIdToken(token);
  } catch (error: any) {
    console.error('API auth error:', error);
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
      const snapshot = await postsCollection
        .where('slug', '==', slug)
        .where('published', '==', true)
        .get();
      
      if (snapshot.empty) {
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
      
      const doc = snapshot.docs[0];
      return res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          ...doc.data()
        }
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