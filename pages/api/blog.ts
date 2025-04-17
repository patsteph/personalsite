import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeAdminApp, getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';
import { Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

// Ensure Firebase Admin is initialized
initializeAdminApp();
const db = getAdminFirestore();
const auth = getAdminAuth();

const BLOG_COLLECTION = 'blog-posts'; // Corrected collection name

type BlogResponse = {
  success: boolean;
  data?: any; // Can be a single post or an array of posts
  error?: string;
}

// Helper to convert Firestore doc data (with Timestamps) to API response format (with ISO strings)
function convertFirestoreToApiResponse(docData: FirebaseFirestore.DocumentData): any {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return data;
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
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    // Verify the ID token
    await auth.verifyIdToken(idToken);
    // TODO: Optionally check for specific user roles/claims if needed
  } catch (error: any) {
    console.error('Blog API auth error:', error);
    return res.status(401).json({ success: false, error: 'Unauthorized - Invalid token' });
  }

  // Handle authenticated requests
  const postsCollection = db.collection(BLOG_COLLECTION);

  // GET - Get all blog posts (including unpublished, admin-only)
  if (req.method === 'GET' && req.query.admin) {
    try {
      console.log(`Admin request: Fetching all documents from ${BLOG_COLLECTION}`);
      const querySnapshot = await postsCollection.orderBy('updatedAt', 'desc').get(); // Fetch all, order by update time
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirestoreToApiResponse(doc.data())
      }));
      console.log(`Admin request: Found ${posts.length} posts.`);
      return res.status(200).json({ success: true, data: posts });
    } catch (error: any) {
      console.error('API error fetching all blog posts (admin):', error);
      console.error('Firestore Error Code:', error.code);
      console.error('Firestore Error Message:', error.message);
      const errorMessage = error.code === 'FAILED_PRECONDITION' && error.message.includes('index')
        ? 'Firestore query requires an index. Please check Firebase console.'
        : 'Failed to fetch blog posts due to a server error.';
      return res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // POST - Create a new blog post
  if (req.method === 'POST') {
    try {
      // TODO: Replace with server-side API call to create a blog post
      // Placeholder: Simulate blog post creation
      const now = new Date();
      const postData = {
        ...req.body,
        // Convert potential string dates back to Timestamps for Firestore
        createdAt: Timestamp.fromDate(new Date(req.body.createdAt || now)),
        updatedAt: Timestamp.fromDate(new Date(req.body.updatedAt || now)),
        publishedAt: req.body.published ? Timestamp.fromDate(new Date(req.body.publishedAt || now)) : null
      };
      // Remove id if present, Firestore generates it
      delete postData.id;
      
      const docRef = await postsCollection.add(postData);
      return res.status(201).json({
        success: true,
        data: {
          id: docRef.id,
          ...convertFirestoreToApiResponse(postData) // Convert back to strings for response
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
      const docRef = postsCollection.doc(id);
      const updateData = {
        ...req.body,
        updatedAt: Timestamp.now(), // Always update timestamp
        // Convert potential string dates back to Timestamps if they exist
        ...(req.body.publishedAt && { publishedAt: Timestamp.fromDate(new Date(req.body.publishedAt)) }),
        ...(req.body.createdAt && { createdAt: Timestamp.fromDate(new Date(req.body.createdAt)) }),
      };
      // Don't allow changing the ID via PUT
      delete updateData.id; 

      await docRef.update(updateData);

      // Fetch the updated document to return it
      const updatedDoc = await docRef.get();
      if (!updatedDoc.exists) {
         return res.status(404).json({ success: false, error: 'Blog post not found after update' });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: updatedDoc.id,
          ...convertFirestoreToApiResponse(updatedDoc.data()!)
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
      const docRef = postsCollection.doc(id);
      await docRef.delete();

      return res.status(200).json({ 
        success: true, 
        data: { id } // Confirm deletion by returning ID
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
  const postsCollection = db.collection(BLOG_COLLECTION);
  const { id, slug, published, limit, tag } = req.query;

  try {
    // Handle fetching a single post by ID
    if (id && typeof id === 'string') {
      const docRef = postsCollection.doc(id);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const postData = docSnap.data();
        // Optionally check if the post is published before returning
        if (postData?.published) {
            return res.status(200).json({
              success: true,
              data: { id: docSnap.id, ...convertFirestoreToApiResponse(postData) }
            });
        } else {
            // If admin didn't request it, treat unpublished as not found for public
            return res.status(404).json({ success: false, error: 'Blog post not found or not published' });
        }
      } else {
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
    }

    // Handle fetching a single post by slug
    if (slug && typeof slug === 'string') {
      const querySnapshot = await postsCollection
        .where('slug', '==', slug)
        .where('published', '==', true) // Only fetch published by slug publicly
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return res.status(200).json({
          success: true,
          data: { id: docSnap.id, ...convertFirestoreToApiResponse(docSnap.data()) }
        });
      } else {
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
    }
    
    // Handle fetching posts by tag
    if (tag && typeof tag === 'string') {
      const numLimit = typeof limit === 'string' ? parseInt(limit, 10) : 10; // Default limit for tag lists
      const querySnapshot = await postsCollection
        .where('tags', 'array-contains', tag)
        .where('published', '==', true)
        .orderBy('publishedAt', 'desc') // Assuming you want newest first
        .limit(numLimit)
        .get();
      
      const posts = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ 
          id: doc.id, 
          ...convertFirestoreToApiResponse(doc.data()) 
      }));
      return res.status(200).json({ success: true, data: posts });
    }

    // Handle fetching multiple published posts (e.g., for the home page)
    if (published === 'true') {
      const numLimit = typeof limit === 'string' ? parseInt(limit, 10) : 3;
      const querySnapshot = await postsCollection
        .where('published', '==', true)
        .orderBy('publishedAt', 'desc') // Assuming you want newest first
        .limit(numLimit)
        .get();

      const posts = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ 
          id: doc.id, 
          ...convertFirestoreToApiResponse(doc.data()) 
      }));
      return res.status(200).json({ success: true, data: posts });
    }

    // If none of the above conditions match, return bad request or not found
    // Returning 400 might be more appropriate if no valid query params were given
    return res.status(400).json({ success: false, error: 'Invalid request parameters for public blog posts' });

  } catch (error: any) {
    console.error('Error in handlePublicGet for blog API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error fetching blog posts' });
  }
}