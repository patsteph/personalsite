import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeAdminApp, getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin'; // Using alias
import { Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeAdminApp();
const db = getAdminFirestore();
const auth = getAdminAuth();

const BOOKS_COLLECTION = 'books';

type BookResponse = {
  success: boolean;
  data?: any; // Can be a single book or an array of books
  error?: string;
}

// Helper to convert Firestore doc data (with Timestamps) to API response format (with ISO strings)
// Duplicated from blog API - consider moving to a shared util later
function convertFirestoreToApiResponse(docData: FirebaseFirestore.DocumentData): any {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return data;
}

// Helper to sanitize incoming data (undefined -> null)
function sanitizeData(body: any): Record<string, any> {
    return Object.entries(body).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? null : value;
        return acc;
    }, {} as Record<string, any>);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BookResponse>
) {
  console.log('Books API received', req.method, 'request',
    req.query ? `with query: ${JSON.stringify(req.query)}` : '',
    req.body ? `with body: ${JSON.stringify(req.body)}` : ''
  );
  
  // --- CORS Headers --- (Keep existing headers)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust in production if needed
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Books API: Handling OPTIONS preflight request.');
    return res.status(200).end();
  }
  
  // --- Authentication Check --- (Applies to all methods: GET, POST, PUT, DELETE)
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      console.log('Books API: No token provided.');
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    await auth.verifyIdToken(idToken);
    console.log('Books API: Token verified successfully.');
  } catch (error: any) {
    console.error('Books API auth error:', error.code, error.message);
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ success: false, error: 'Unauthorized - Token expired' });
    }
    return res.status(401).json({ success: false, error: 'Unauthorized - Invalid token' });
  }
  // --- End Authentication Check ---
  
  const booksCollection = db.collection(BOOKS_COLLECTION);
  
  // GET - Get all books or a specific book by ID
  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      if (id && typeof id === 'string') {
        // Fetch specific book by ID
        console.log(`Books API: Handling GET request for ID: ${id}`);
        const docRef = booksCollection.doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          console.log(`Books API: Found book with ID: ${id}`);
          return res.status(200).json({
            success: true,
            data: { id: docSnap.id, ...convertFirestoreToApiResponse(docSnap.data()!) }
          });
        } else {
          console.log(`Books API: Book not found with ID: ${id}`);
          return res.status(404).json({ success: false, error: 'Book not found' });
        }
      } else {
        // Fetch all books
        console.log('Books API: Handling GET request for all books.');
        // Consider adding ordering, e.g., .orderBy('createdAt', 'desc')
        const querySnapshot = await booksCollection.get(); 
        const books = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...convertFirestoreToApiResponse(doc.data())
        }));
        console.log(`Books API: Found ${books.length} books.`);
        return res.status(200).json({ success: true, data: books });
      }
    } catch (error: any) {
      console.error('Books API error handling GET:', error);
      return res.status(500).json({ success: false, error: `Internal server error: ${error.message}` });
    }
  }
  
  // POST - Create a new book
  if (req.method === 'POST') {
    try {
      console.log('Books API: Handling POST request.');
      const sanitizedBody = sanitizeData(req.body);
      
      // Basic validation (add more as needed)
      if (!sanitizedBody.title || !Array.isArray(sanitizedBody.authors) || sanitizedBody.authors.length === 0) {
          return res.status(400).json({ success: false, error: 'Missing required fields (title, non-empty authors array)' });
      }

      const now = Timestamp.now();
      const bookData = {
        ...sanitizedBody,
        // Convert date strings if provided, else use current time
        createdAt: sanitizedBody.createdAt ? Timestamp.fromDate(new Date(sanitizedBody.createdAt)) : now,
        updatedAt: now,
        // Convert finishedDate if provided
        ...(sanitizedBody.finishedDate && { finishedDate: Timestamp.fromDate(new Date(sanitizedBody.finishedDate)) })
      };
      delete bookData.id; // Firestore generates ID
      
      console.log('Books API: Adding document to Firestore:', bookData);
      const docRef = await booksCollection.add(bookData);
      console.log('Books API: Document added with ID:', docRef.id);
      
      // Fetch the newly created document
      const newDoc = await docRef.get();
      if (!newDoc.exists) { 
          console.error('Books API: Failed to retrieve newly created book document:', docRef.id);
          return res.status(500).json({ success: false, error: 'Failed to retrieve book after creation' });
      }

      return res.status(201).json({
        success: true,
        data: {
          id: newDoc.id,
          ...convertFirestoreToApiResponse(newDoc.data()!)
        }
      });
    } catch (error: any) {
      console.error('Books API error creating book:', error);
      return res.status(500).json({ success: false, error: `Internal server error: ${error.message}` });
    }
  }
  
  // PUT - Update a book
  if (req.method === 'PUT') {
    try {
      console.log('Books API: Handling PUT request.');
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Book ID is required in query parameters' });
      }
      
      const docRef = booksCollection.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.log(`Books API: PUT failed, document not found: ${id}`);
        return res.status(404).json({ success: false, error: 'Book not found' });
      }
      
      const sanitizedBody = sanitizeData(req.body);
      const updateData: { [key: string]: any } = { 
          ...sanitizedBody,
          updatedAt: Timestamp.now() // Always update timestamp
      };
      delete updateData.id; // Prevent changing ID
      delete updateData.createdAt; // Don't update createdAt

      // Convert finishedDate if provided
      if (updateData.hasOwnProperty('finishedDate')) { 
        updateData.finishedDate = updateData.finishedDate ? Timestamp.fromDate(new Date(updateData.finishedDate)) : null;
      }
      
      console.log(`Books API: Updating document ${id} with data:`, updateData);
      await docRef.update(updateData);
      console.log(`Books API: Document ${id} updated successfully.`);
      
      // Fetch and return the updated document
      const updatedDoc = await docRef.get();
      if (!updatedDoc.exists) { 
         console.error(`Books API: Book document ${id} not found after update.`);
         return res.status(404).json({ success: false, error: 'Book not found after update' });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: updatedDoc.id,
          ...convertFirestoreToApiResponse(updatedDoc.data()!)
        }
      });
    } catch (error: any) {
      console.error(`Books API error updating book ${req.query.id}:`, error);
      return res.status(500).json({ success: false, error: `Internal server error: ${error.message}` });
    }
  }
  
  // DELETE - Delete a book
  if (req.method === 'DELETE') {
    try {
      console.log('Books API: Handling DELETE request.');
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Book ID is required in query parameters' });
      }
      
      const docRef = booksCollection.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
          console.log(`Books API: DELETE skipped, document not found: ${id}`);
          // Idempotent: Return success even if already deleted
          return res.status(200).json({ success: true, data: { id, message: 'Already deleted or never existed' } });
      }

      console.log(`Books API: Deleting document ${id}.`);
      await docRef.delete();
      console.log(`Books API: Document ${id} deleted successfully.`);

      return res.status(200).json({ 
        success: true, 
        data: { id } // Confirm deletion by returning ID
      });
    } catch (error: any) {
      console.error(`Books API error deleting book ${req.query.id}:`, error);
      return res.status(500).json({ success: false, error: `Internal server error: ${error.message}` });
    }
  }
  
  // Method Not Allowed
  console.log(`Books API: Method ${req.method} not allowed.`);
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
  return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
}