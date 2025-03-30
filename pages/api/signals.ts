// pages/api/signals.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from '../../lib/firebase-admin';
import Cors from 'cors';

// Initialize CORS middleware with debugging
const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: '*',
  credentials: true,
  preflightContinue: true,
});

// Debug incoming requests
console.log('Signals API module loaded');

// Helper function to run middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Signals API: ${req.method} request received at ${new Date().toISOString()}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  
  // For POST/PUT requests, log the body too
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      console.log('Body:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2));
    } catch (e) {
      console.log('Could not stringify body:', e);
    }
  }
  
  // Run the CORS middleware
  await runMiddleware(req, res, cors);
  console.log('CORS middleware completed');

  try {
    // Set cache headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    
    // Verify authentication for non-GET requests
    if (req.method !== 'GET') {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        
        const token = authHeader.split('Bearer ')[1];
        await auth.verifyIdToken(token);
      } catch (error) {
        console.error('API auth error:', error);
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }

    const signalsCollection = firestore.collection('signals');

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Get signals (with optional filtering)
        const { id, type, featured } = req.query;
        
        // Get a specific signal if ID is provided
        if (id && typeof id === 'string') {
          const doc = await signalsCollection.doc(id).get();
          
          if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Signal not found' });
          }
          
          return res.status(200).json({
            success: true,
            data: {
              id: doc.id,
              ...doc.data()
            }
          });
        }
        
        // Get all signals and filter client-side if needed
        const snapshot = await signalsCollection.orderBy('dateAdded', 'desc').get();
        const signals: any[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          
          // Client-side filtering
          if (type && typeof type === 'string' && data.type !== type) {
            return;
          }
          
          if (featured && data.featured !== (featured === 'true')) {
            return;
          }
          
          signals.push({
            id: doc.id,
            ...data
          });
        });
        
        return res.status(200).json({ success: true, data: signals });

      case 'POST':
        // Create a new signal
        const signalData = req.body;
        
        // Validate required fields
        if (!signalData.title || !signalData.type || !signalData.url) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: title, type, and url are required' 
          });
        }
        
        // Add timestamps
        const now = new Date().toISOString();
        signalData.dateAdded = now;
        signalData.updatedAt = now;
        
        // Add the signal to Firestore
        const docRef = await signalsCollection.add(signalData);
        
        return res.status(201).json({ 
          success: true, 
          data: { id: docRef.id, ...signalData } 
        });

      case 'PUT':
        // Update a signal
        const { id: updateId, ...updateData } = req.body;
        
        if (!updateId) {
          return res.status(400).json({ success: false, error: 'Signal ID is required' });
        }
        
        // Update the timestamp
        updateData.updatedAt = new Date().toISOString();
        
        // Update the signal in Firestore
        await signalsCollection.doc(updateId).update(updateData);
        
        return res.status(200).json({ 
          success: true, 
          data: { id: updateId, ...updateData } 
        });

      case 'DELETE':
        // Delete a signal
        const deleteId = req.query.id as string;
        
        if (!deleteId) {
          return res.status(400).json({ success: false, error: 'Signal ID is required' });
        }
        
        // Delete the signal from Firestore
        await signalsCollection.doc(deleteId).delete();
        
        return res.status(200).json({ 
          success: true, 
          data: { message: 'Signal deleted successfully' }
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error';
    const stack = error.stack || '';
    
    console.error('🚨 ERROR in signals API handler:');
    console.error(`Message: ${errorMsg}`);
    console.error(`Stack: ${stack}`);
    console.error('Error object:', error);
    
    // Always return detailed error info regardless of environment
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: errorMsg,
      stack: stack.split('\n')
    });
  }
}