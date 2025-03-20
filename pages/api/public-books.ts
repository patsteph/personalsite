// pages/api/public-books.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

type BookResponse = {
  success: boolean;
  data?: any;
  error?: string;
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
  
  const booksCollection = firestore.collection('books');
  
  try {
    const { id, status } = req.query;
    
    if (id && typeof id === 'string') {
      // Get a specific book
      const doc = await booksCollection.doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ success: false, error: 'Book not found' });
      }
      
      // Return the book data
      return res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          ...doc.data()
        }
      });
    } else {
      // Get all books with optional filtering
      let query = booksCollection.orderBy('title');
      
      // Add status filter if provided
      if (status && typeof status === 'string') {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      const books: any[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Add extra safety for arrays
        books.push({
          id: doc.id,
          ...data,
          // Ensure authors is always an array
          authors: Array.isArray(data.authors) ? data.authors : ['Unknown Author'],
          // Ensure categories is always an array if it exists
          categories: data.categories ? 
            (Array.isArray(data.categories) ? data.categories : []) : 
            undefined
        });
      });
      
      return res.status(200).json({ success: true, data: books });
    }
  } catch (error: any) {
    console.error('API error getting books:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}