import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from '@/lib/firebase-admin';

type BookResponse = {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BookResponse>
) {
  console.log('Books API:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verify authentication for all requests
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
  
  const booksCollection = firestore.collection('books');
  
  // GET - Get all books or a specific book
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      
      if (id && typeof id === 'string') {
        // Get a specific book
        const doc = await booksCollection.doc(id).get();
        
        if (!doc.exists) {
          return res.status(404).json({ success: false, error: 'Book not found' });
        }
        
        return res.status(200).json({
          success: true,
          data: {
            id: doc.id,
            ...doc.data()
          }
        });
      } else {
        // Get all books
        const snapshot = await booksCollection.orderBy('title').get();
        const books: any[] = [];
        
        snapshot.forEach(doc => {
          books.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return res.status(200).json({ success: true, data: books });
      }
    } catch (error: any) {
      console.error('API error getting books:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // POST - Create a new book
  if (req.method === 'POST') {
    try {
      // Convert any undefined values to null for Firestore compatibility
      const sanitizedBody = Object.entries(req.body).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? null : value;
        return acc;
      }, {} as Record<string, any>);
      
      const bookData = {
        ...sanitizedBody,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('API: Adding book with sanitized data', bookData);
      
      const docRef = await booksCollection.add(bookData);
      
      return res.status(201).json({
        success: true,
        data: {
          id: docRef.id,
          ...bookData
        }
      });
    } catch (error: any) {
      console.error('API error creating book:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // PUT - Update a book
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Book ID is required' });
      }
      
      // Convert any undefined values to null for Firestore compatibility
      const sanitizedBody = Object.entries(req.body).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? null : value;
        return acc;
      }, {} as Record<string, any>);
      
      const bookData = {
        ...sanitizedBody,
        updatedAt: new Date().toISOString()
      };
      
      await booksCollection.doc(id).update(bookData);
      
      return res.status(200).json({
        success: true,
        data: {
          id,
          ...bookData
        }
      });
    } catch (error: any) {
      console.error('API error updating book:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // DELETE - Delete a book
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Book ID is required' });
      }
      
      await booksCollection.doc(id).delete();
      
      return res.status(200).json({ 
        success: true, 
        data: { message: 'Book deleted successfully' }
      });
    } catch (error: any) {
      console.error('API error deleting book:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}