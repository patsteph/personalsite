import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

type PostResponse = {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse>
) {
  // Log request for debugging
  console.log('Blog Post API received', req.method, 'request', 
    req.query ? `with query: ${JSON.stringify(req.query)}` : '');
  
  const { id, slug } = req.query;
  
  try {
    const postsCollection = firestore.collection('blog-posts');
    
    // Get by ID is more reliable if it's provided
    if (id && typeof id === 'string') {
      console.log(`Blog Post API: Fetching post with ID "${id}"`);
      const docRef = postsCollection.doc(id);
      const docSnapshot = await docRef.get();
      
      if (!docSnapshot.exists) {
        return res.status(404).json({
          success: false,
          error: `No blog post found with ID ${id}`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          id: docSnapshot.id,
          ...docSnapshot.data()
        }
      });
    }
    
    // If ID is not provided, try by slug
    if (slug && typeof slug === 'string') {
      console.log(`Blog Post API: Fetching post with slug "${slug}"`);
      
      // Try exact slug match first
      let snapshot = await postsCollection.where('slug', '==', slug).get();
      
      // Try known alternative slugs if no exact match
      if (snapshot.empty) {
        console.log(`Blog Post API: No exact match for slug "${slug}", trying alternatives`);
        
        const alternativeSlugs = [
          'building-my-personal-site-a-journey-from-not-a-programmer-to-web-developer-sort-of-',
          'this-site'
        ];
        
        for (const altSlug of alternativeSlugs) {
          if (altSlug === slug) continue;
          
          console.log(`Blog Post API: Trying alternative slug "${altSlug}"`);
          snapshot = await postsCollection.where('slug', '==', altSlug).get();
          
          if (!snapshot.empty) {
            console.log(`Blog Post API: Found post with alternative slug "${altSlug}"`);
            break;
          }
        }
      }
      
      // If we still have no match, get all posts and try to find the closest match
      if (snapshot.empty) {
        console.log(`Blog Post API: No post found for known slugs, trying to find closest match`);
        
        snapshot = await postsCollection.get();
        
        // Log all available slugs for debugging
        if (!snapshot.empty) {
          console.log('Blog Post API: Available slugs:');
          snapshot.forEach(doc => {
            console.log(`  ${doc.id}: ${doc.data().slug}`);
          });
          
          // Try to find a closest match
          const allDocs = snapshot.docs;
          const closestMatch = allDocs.find(doc => {
            const postSlug = doc.data().slug || '';
            return postSlug.includes(slug) || slug.includes(postSlug);
          });
          
          if (closestMatch) {
            console.log(`Blog Post API: Found closest match with slug "${closestMatch.data().slug}"`);
            
            return res.status(200).json({
              success: true,
              data: {
                id: closestMatch.id,
                ...closestMatch.data(),
                _matchType: 'similar'
              }
            });
          }
        }
      }
      
      // If no post found after all attempts
      if (snapshot.empty) {
        return res.status(404).json({
          success: false,
          error: `No blog post found with slug "${slug}" after trying all alternatives`
        });
      }
      
      // Return the first document if multiple matches
      return res.status(200).json({
        success: true,
        data: {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        }
      });
    }
    
    // If neither ID nor slug provided
    return res.status(400).json({
      success: false,
      error: 'You must provide either an ID or a slug parameter'
    });
    
  } catch (error: any) {
    console.error('Blog Post API error:', error);
    return res.status(500).json({
      success: false,
      error: `Error fetching blog post: ${error.message}`
    });
  }
}