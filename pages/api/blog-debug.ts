import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

type DebugResponse = {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebugResponse>
) {
  // Allow this endpoint in development/staging only
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG !== 'true') {
    return res.status(404).json({ success: false, error: 'Not found in production' });
  }
  
  console.log('Blog Debug API: Fetching all blog posts from Firestore');
  
  try {
    // Get all posts from Firestore with no filtering
    const snapshot = await firestore.collection('blog-posts').get();
    
    const posts: any[] = [];
    
    snapshot.forEach(doc => {
      // Get raw document data
      const data = doc.data();
      
      // Convert any Firestore timestamps to ISO strings for JSON serialization
      const serializedData = Object.entries(data).reduce((acc, [key, value]) => {
        // Check if value is a Firestore timestamp
        if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
          acc[key] = value.toDate().toISOString();
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      posts.push({
        id: doc.id,
        ...serializedData,
        _original_slug: data.slug // Save original slug for debugging
      });
    });
    
    console.log(`Blog Debug API: Found ${posts.length} posts`);
    
    // If a specific slug is requested, filter for it
    const { slug } = req.query;
    if (slug && typeof slug === 'string') {
      console.log(`Blog Debug API: Filtering for slug "${slug}"`);
      const filteredPosts = posts.filter(post => 
        post.slug === slug || 
        post._original_slug === slug ||
        post.slug === slug.toLowerCase() ||
        post._original_slug === slug.toLowerCase()
      );
      
      return res.status(200).json({ 
        success: true, 
        data: {
          posts: filteredPosts,
          query: { slug },
          allSlugs: posts.map(p => ({ id: p.id, slug: p.slug }))
        }
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: {
        posts,
        allSlugs: posts.map(p => ({ id: p.id, slug: p.slug }))
      }
    });
  } catch (error: any) {
    console.error('Blog Debug API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}