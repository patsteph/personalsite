import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from '../../lib/firebase-admin';

type SignalResponse = {
  success: boolean;
  data?: any;
  error?: string;
  socialShareResults?: Record<string, 'success' | 'error'>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignalResponse>
) {
  console.log('Signals API:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log request details for debugging
  console.log(`Signals API: ${req.method} request received at ${new Date().toISOString()}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  
  // For POST/PUT requests, log the body
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      console.log('Body:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2));
    } catch (e) {
      console.log('Could not stringify body:', e);
    }
  }
  
  // Initialize Firestore collection early to avoid potential initialization issues
  console.log('Initializing signals collection');
  const signalsCollection = firestore.collection('signals');
  
  // GET - Get all signals or a specific signal
  if (req.method === 'GET') {
    try {
      console.log('Processing GET request for signals');
      const { id, type } = req.query;
      
      if (id && typeof id === 'string') {
        // Get a specific signal
        console.log(`Getting signal with ID: ${id}`);
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
      } else if (type && typeof type === 'string') {
        // Get signals by type
        console.log(`Getting signals with type: ${type}`);
        const snapshot = await signalsCollection.where('type', '==', type).get();
        const signals: any[] = [];
        
        snapshot.forEach(doc => {
          signals.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return res.status(200).json({ success: true, data: signals });
      } else {
        // Get all signals
        console.log('Getting all signals');
        const snapshot = await signalsCollection.orderBy('dateAdded', 'desc').get();
        const signals: any[] = [];
        
        snapshot.forEach(doc => {
          signals.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return res.status(200).json({ success: true, data: signals });
      }
    } catch (error: any) {
      console.error('API error getting signals:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Check authentication for non-GET methods
  try {
    console.log('Checking authentication for non-GET request');
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header found');
      return res.status(401).json({ success: false, error: 'Unauthorized - No valid auth token' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    await auth.verifyIdToken(token);
    console.log('Authentication successful');
  } catch (error: any) {
    console.error('API auth error:', error);
    return res.status(401).json({ success: false, error: `Authentication error: ${error.message}` });
  }
  
  // POST - Create a new signal
  if (req.method === 'POST') {
    try {
      console.log('Processing POST request to create a signal');
      // Extract social share settings if present
      const { shareToSocial, ...signalData } = req.body;
      
      // Convert any undefined values to null for Firestore compatibility
      const sanitizedBody = Object.entries(signalData).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? null : value;
        return acc;
      }, {} as Record<string, any>);
      
      const now = new Date().toISOString();
      const newSignalData = {
        ...sanitizedBody,
        dateAdded: now,
        updatedAt: now
      };
      
      console.log('Adding signal with sanitized data', newSignalData);
      
      const docRef = await signalsCollection.add(newSignalData);
      console.log(`Signal created with ID: ${docRef.id}`);
      
      // Handle social sharing if requested
      let socialShareResults: Record<string, 'success' | 'error'> | undefined = undefined;
      
      if (shareToSocial) {
        socialShareResults = {};
        // This is where you would add code to handle social sharing
        // For now, we'll simulate success for demonstration purposes
        if (shareToSocial.linkedin) socialShareResults.linkedin = 'success';
        if (shareToSocial.twitter) socialShareResults.twitter = 'success';
        if (shareToSocial.bluesky) socialShareResults.bluesky = 'success';
      }
      
      return res.status(201).json({
        success: true,
        data: {
          id: docRef.id,
          ...newSignalData
        },
        socialShareResults
      });
    } catch (error: any) {
      console.error('API error creating signal:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // PUT - Update a signal
  if (req.method === 'PUT') {
    try {
      console.log('Processing PUT request to update a signal');
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ success: false, error: 'Signal ID is required' });
      }
      
      // Extract social share settings if present
      const { shareToSocial, ...signalData } = req.body;
      
      // Convert any undefined values to null for Firestore compatibility
      const sanitizedBody = Object.entries(signalData).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? null : value;
        return acc;
      }, {} as Record<string, any>);
      
      // Remove id from the data to be updated
      delete sanitizedBody.id;
      
      const updateData = {
        ...sanitizedBody,
        updatedAt: new Date().toISOString()
      };
      
      await signalsCollection.doc(id).update(updateData);
      console.log(`Signal with ID ${id} updated successfully`);
      
      // Handle social sharing if requested
      let socialShareResults: Record<string, 'success' | 'error'> | undefined = undefined;
      
      if (shareToSocial) {
        socialShareResults = {};
        // This is where you would add code to handle social sharing
        // For now, we'll simulate success for demonstration purposes
        if (shareToSocial.linkedin) socialShareResults.linkedin = 'success';
        if (shareToSocial.twitter) socialShareResults.twitter = 'success';
        if (shareToSocial.bluesky) socialShareResults.bluesky = 'success';
      }
      
      return res.status(200).json({
        success: true,
        data: {
          id,
          ...updateData
        },
        socialShareResults
      });
    } catch (error: any) {
      console.error('API error updating signal:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // DELETE - Delete a signal
  if (req.method === 'DELETE') {
    try {
      console.log('Processing DELETE request');
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Signal ID is required' });
      }
      
      await signalsCollection.doc(id).delete();
      console.log(`Signal with ID ${id} deleted successfully`);
      
      return res.status(200).json({ 
        success: true, 
        data: { message: 'Signal deleted successfully' }
      });
    } catch (error: any) {
      console.error('API error deleting signal:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // If we get here, the HTTP method is not supported
  console.log(`Method ${req.method} not supported`);
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}