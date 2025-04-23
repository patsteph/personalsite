// pages/api/public-books.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

type BookResponse = {
  success: boolean;
  data?: any; // Can be a single book or an array of books
  error?: string;
}

// Helper to convert Firestore doc data (with Timestamps) to API response format
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
  res: NextApiResponse<BookResponse>
) {
  // This endpoint only supports GET requests for public book data
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only GET requests are supported.' 
    });
  }
  
  try {
    // Initialize Firestore
    const db = getAdminFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize Firestore'
      });
    }

    const { id, favourite, genre } = req.query;
    const booksCollection = db.collection('books');

    // Handling single book request
    if (id && typeof id === 'string') {
      // Get book by ID
      const bookDoc = await booksCollection.doc(id).get();
      
      if (!bookDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Book not found'
        });
      }

      // Format and return the book
      const bookData = convertFirestoreToApiResponse({
        id: bookDoc.id,
        ...bookDoc.data()
      });

      return res.status(200).json({
        success: true,
        data: bookData
      });
    } else {
      // Handling query for multiple books
      let query = booksCollection.where('publiclyVisible', '==', true);
      
      // Apply favourite filter if requested
      if (favourite === 'true') {
        query = query.where('favourite', '==', true);
      }
      
      // Apply genre filter if requested
      if (genre && typeof genre === 'string') {
        query = query.where('categories', 'array-contains', genre);
      }

      // Apply default sorting
      query = query.orderBy('title');
      
      // Execute query
      const booksSnapshot = await query.get();
      const books = booksSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        return convertFirestoreToApiResponse({
          id: doc.id,
          ...doc.data()
        });
      });

      return res.status(200).json({
        success: true,
        data: books
      });
    }
  } catch (error: any) {
    console.error('Error in public-books API:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
}
