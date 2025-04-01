/**
 * Direct books API endpoint that connects directly to Firebase
 * This endpoint uses Firebase Admin SDK for direct database access
 * while still maintaining proper authentication validation
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import { Book } from '@/types/book';

// Configure API to handle both JSON and form data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  console.log('BOOKS-DIRECT API:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Authenticate the request
  try {
    // Allow unauthenticated GET requests for the public books endpoint
    if (req.method !== 'GET') {
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - Authentication required'
        });
      }
      console.log('User authenticated:', userId);
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed',
      details: authError instanceof Error ? authError.message : String(authError)
    });
  }
  
  // Use Firestore Admin instance
  if (!firestore) {
    return res.status(500).json({ 
      success: false, 
      error: 'Firestore not initialized' 
    });
  }
  
  // Collection name
  const BOOKS_COLLECTION = 'books';
  
  // Log request body for debugging
  if (req.method !== 'GET' && req.body) {
    console.log('Request body:', 
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    );
  }
  
  try {
    // Handle GET request
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        // Get single book
        const bookRef = firestore.collection(BOOKS_COLLECTION).doc(id as string);
        const bookSnap = await bookRef.get();
        
        if (!bookSnap.exists) {
          return res.status(404).json({ 
            success: false, 
            error: `Book with ID ${id} not found` 
          });
        }
        
        const bookData = bookSnap.data();
        return res.status(200).json({
          success: true,
          data: {
            id: bookSnap.id,
            ...bookData
          }
        });
      } else {
        // Get all books
        const booksSnapshot = await firestore.collection(BOOKS_COLLECTION)
          .orderBy('dateAdded', 'desc')
          .get();
        
        const books = booksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        return res.status(200).json({
          success: true,
          data: books
        });
      }
    }
    
    // Handle POST request (create)
    if (req.method === 'POST') {
      const bookData = req.body;
      
      // Add some required fields if missing
      const enhancedBookData = {
        ...bookData,
        dateAdded: new Date().toISOString()
      };
      
      const docRef = await firestore.collection(BOOKS_COLLECTION).add(enhancedBookData);
      
      return res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: {
          id: docRef.id,
          ...enhancedBookData
        }
      });
    }
    
    // Handle PUT request (update)
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Book ID is required for update operation'
        });
      }
      
      const bookData = req.body;
      
      // Add updated timestamp
      const updatedData = {
        ...bookData,
        updatedAt: new Date().toISOString()
      };
      
      await firestore.collection(BOOKS_COLLECTION).doc(id).update(updatedData);
      
      return res.status(200).json({
        success: true,
        message: 'Book updated successfully',
        data: {
          id,
          ...updatedData
        }
      });
    }
    
    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Book ID is required for delete operation'
        });
      }
      
      await firestore.collection(BOOKS_COLLECTION).doc(id).delete();
      
      return res.status(200).json({
        success: true,
        message: 'Book deleted successfully',
        data: { id }
      });
    }
    
    // If we get here, method not supported but respond nicely
    return res.status(200).json({
      success: true,
      message: `Method ${req.method} handled in books-direct endpoint`,
      note: 'This is a fallback response - method not fully implemented',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in books-direct API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}