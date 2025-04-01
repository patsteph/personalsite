/**
 * Books debug endpoint that works without requiring Firebase authentication
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log request details
  console.log('BOOKS DEBUG API:', req.method, req.url);
  console.log('Request headers:', JSON.stringify(req.headers));
  
  // Try to log body if present
  if (req.body) {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('Request body:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      console.log('Raw request body:', req.body);
    }
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Set content type for all non-OPTIONS responses
  if (req.method !== 'OPTIONS') {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Parse token from Authorization header
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('Authorization header found');
    const token = authHeader.split('Bearer ')[1];
    console.log('Token length:', token.length);
    userId = 'token-received'; // Just acknowledge we got a token
  }
  
  // Handle POST (Create book)
  if (req.method === 'POST') {
    try {
      // Just echo back the book data with an ID
      const bookData = req.body;
      const bookId = `debug-book-${Date.now()}`;
      
      return res.status(200).json({
        success: true,
        message: 'Book created successfully (debug mode)',
        data: {
          id: bookId,
          ...bookData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in books-debug POST:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Handle GET (List books or get book)
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      
      if (id) {
        // Return a mock book for the given ID
        return res.status(200).json({
          success: true,
          data: {
            id,
            title: 'Debug Book',
            authors: ['Debug Author'],
            status: 'read',
            dateAdded: new Date().toISOString(),
            notes: 'This is a debug book'
          }
        });
      } else {
        // Return a list of mock books
        return res.status(200).json({
          success: true,
          data: [
            {
              id: 'debug-book-1',
              title: 'Debug Book 1',
              authors: ['Debug Author 1'],
              status: 'read',
              dateAdded: new Date().toISOString()
            },
            {
              id: 'debug-book-2',
              title: 'Debug Book 2',
              authors: ['Debug Author 2'],
              status: 'reading',
              dateAdded: new Date().toISOString()
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error in books-debug GET:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Handle PUT (Update book)
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const updates = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Book ID is required'
        });
      }
      
      // Return the updated book data
      return res.status(200).json({
        success: true,
        message: 'Book updated successfully (debug mode)',
        data: {
          id,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in books-debug PUT:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Handle DELETE
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Book ID is required'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Book deleted successfully (debug mode)',
        data: { id }
      });
    } catch (error) {
      console.error('Error in books-debug DELETE:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // For any other method
  return res.status(200).json({
    success: true,
    message: `Received request with method ${req.method}`,
    timestamp: new Date().toISOString()
  });
}