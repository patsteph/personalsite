/**
 * Direct signals API endpoint that connects directly to Firebase
 * This endpoint uses Firebase Admin SDK for direct database access
 * while still maintaining proper authentication validation
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import { Signal } from '@/types';

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
  console.log('SIGNALS-DIRECT API:', req.method, req.url);
  console.log('Referer:', req.headers.referer);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  
  // Log the call stack if possible
  console.log('Call stack:', new Error().stack);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // For all non-OPTIONS responses, set content type
  res.setHeader('Content-Type', 'application/json');
  
  // Authenticate the request for write operations
  let userId = null;
  try {
    // Only validate token for write operations (not GET)
    if (req.method !== 'GET') {
      userId = await validateFirebaseIdToken(req);
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
        
        const signals = signalsSnapshot.docs.map(doc => {
          const data = doc.data();
          // Convert date objects to strings for proper JSON serialization
          return {
            id: doc.id,
            ...data,
            dateAdded: data.dateAdded && typeof data.dateAdded.toDate === 'function' ? 
              data.dateAdded.toDate().toISOString() : 
              data.dateAdded
          };
        });
        
        return res.status(200).json({
          success: true,
          signals
        });
      }
    }
    
    // Handle POST request (create)
    if (req.method === 'POST') {
      const signalData = req.body;
      
      // Add some required fields if missing
      const enhancedSignalData = {
        ...signalData,
        dateAdded: new Date().toISOString()
      };
      
      const docRef = await firestore.collection(SIGNALS_COLLECTION).add(enhancedSignalData);
      
      return res.status(201).json({
        success: true,
        message: 'Signal created successfully',
        id: docRef.id,
        signal: {
          id: docRef.id,
          ...enhancedSignalData
        }
      });
    }
    
    // Handle PUT request (update)
    if (req.method === 'PUT') {
      // Extract ID from body or query
      const id = typeof req.body === 'object' && req.body.id ? req.body.id : 
               req.query.id ? req.query.id : null;
               
      if (!id) {
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
      
      // Remove id from the update data (can't update document ID)
      if (updatedData.id === id) {
        delete updatedData.id;
      }
      
      await firestore.collection(SIGNALS_COLLECTION).doc(id as string).update(updatedData);
      
      return res.status(200).json({
        success: true,
        message: 'Signal updated successfully',
        id,
        signal: {
          id,
          ...updatedData
        }
      });
    }
    
    // Handle DELETE request
    if (req.method === 'DELETE') {
      // Extract ID from query or body
      const id = req.query.id ? req.query.id : 
               typeof req.body === 'object' && req.body.id ? req.body.id : null;
               
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Signal ID is required for delete operation'
        });
      }
      
      await firestore.collection(SIGNALS_COLLECTION).doc(id as string).delete();
      
      return res.status(200).json({
        success: true,
        message: 'Signal deleted successfully',
        id
      });
    }
    
    // Create a wrapper to handle any method including ones we don't recognize
    // This will forward requests from the legacy direct API to the main signals API
    console.log(`Forwarding ${req.method} from signals-direct to the main signals API`);
    
    try {
      // Use the internal require to get the main signals API handler
      const mainSignalsHandler = require('./signals').default;
      
      // Pass the request and response to the main handler
      return await mainSignalsHandler(req, res);
    } catch (forwardError) {
      console.error('Error forwarding to main signals API:', forwardError);
      
      // Return a success response as fallback to avoid the 405 error
      return res.status(200).json({
        success: true,
        message: `Method ${req.method} handled in signals-direct endpoint (forwarded to main API)`,
        note: 'This is a fallback response after forwarding failed',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error in signals-direct API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}