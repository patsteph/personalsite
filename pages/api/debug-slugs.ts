import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

// A simple API that returns all blog post slugs for debugging
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get all blog posts
    const snapshot = await firestore.collection('blog-posts').get();
    
    // Extract the id and slug from each post
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      slug: doc.data().slug || 'no-slug',
      title: doc.data().title || 'Untitled'
    }));
    
    return res.status(200).json({
      success: true,
      posts
    });
  } catch (error: any) {
    console.error('Debug slugs API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}