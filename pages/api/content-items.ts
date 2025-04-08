/**
 * Universal content items API using EXACTLY the same pattern as books-direct
 * This is an endpoint for signals but with a completely different name to avoid middleware
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
// Signal type removed as it's not used directly

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
  console.log('CONTENT-ITEMS API:', req.method, req.url);
  
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
    // Allow unauthenticated GET requests for public content
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
  
  // Collection name - SIGNALS instead of BOOKS
  const SIGNALS_COLLECTION = 'signals';
  
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
        // Get single signal
        const signalRef = firestore.collection(SIGNALS_COLLECTION).doc(id as string);
        const signalSnap = await signalRef.get();
        
        if (!signalSnap.exists) {
          return res.status(404).json({ 
            success: false, 
            error: `Signal with ID ${id} not found` 
          });
        }
        
        const signalData = signalSnap.data();
        return res.status(200).json({
          success: true,
          data: {
            id: signalSnap.id,
            ...signalData
          }
        });
      } else {
        // Get all signals
        const signalsSnapshot = await firestore.collection(SIGNALS_COLLECTION)
          .orderBy('dateAdded', 'desc')
          .get();
        
        const signals = signalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        return res.status(200).json({
          success: true,
          data: signals
        });
      }
    }
    
    // Handle POST request (create)
    if (req.method === 'POST') {
      const signalData = req.body;
      
      // Add some required fields if missing
      const enhancedSignalData = {
        ...signalData,
        dateAdded: new Date().toISOString(),
        featured: signalData.featured || false,
        tags: signalData.tags || []
      };
      
      const docRef = await firestore.collection(SIGNALS_COLLECTION).add(enhancedSignalData);
      
      return res.status(201).json({
        success: true,
        message: 'Signal created successfully',
        data: {
          id: docRef.id,
          ...enhancedSignalData
        }
      });
    }
    
    // Handle PUT request (update)
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Signal ID is required for update operation'
        });
      }
      
      const signalData = req.body;
      
      // Add updated timestamp
      const updatedData = {
        ...signalData,
        updatedAt: new Date().toISOString()
      };
      
      await firestore.collection(SIGNALS_COLLECTION).doc(id).update(updatedData);
      
      return res.status(200).json({
        success: true,
        message: 'Signal updated successfully',
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
          error: 'Signal ID is required for delete operation'
        });
      }
      
      await firestore.collection(SIGNALS_COLLECTION).doc(id).delete();
      
      return res.status(200).json({
        success: true,
        message: 'Signal deleted successfully',
        data: { id }
      });
    }
    
    // If we get here, method not supported but respond nicely
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed in content-items endpoint`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in content-items API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}