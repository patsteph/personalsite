import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from '@/lib/firebase-admin';

type SignalResponse = {
  success: boolean;
  data?: any;
  error?: string;
  count?: number;
  message?: string;
  method?: string;
  supportedMethods?: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignalResponse>
) {
  console.log('Signals Clone API:', req.method, req.url);
  console.log('Request headers:', JSON.stringify(req.headers));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Authenticate for all non-GET requests
  let userId = null;
  if (req.method !== 'GET') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No valid auth header found');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
      console.log('Authentication successful for user:', userId);
    } catch (error: any) {
      console.error('API auth error:', error);
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }
  
  const signalsCollection = firestore.collection('signals');
  
  // GET - Get all signals or a specific signal
  if (req.method === 'GET') {
    try {
      const { id, limit, type, featured } = req.query;
      
      if (id && typeof id === 'string') {
        // Get a specific signal
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
      } else {
        // Build query with optional filters
        let query = signalsCollection.orderBy('dateAdded', 'desc');
        
        if (type === 'newsletter' || type === 'article') {
          query = query.where('type', '==', type);
        }
        
        if (featured === 'true') {
          query = query.where('featured', '==', true);
        }
        
        if (limit && !isNaN(Number(limit))) {
          query = query.limit(Number(limit));
        }
        
        // Execute query
        const snapshot = await query.get();
        const signals: any[] = [];
        
        snapshot.forEach(doc => {
          signals.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return res.status(200).json({ 
          success: true, 
          data: signals,
          count: signals.length
        });
      }
    } catch (error: any) {
      console.error('API error getting signals:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // POST - Create a new signal
  if (req.method === 'POST') {
    try {
      console.log('Processing POST request for signals');
      console.log('Request body:', req.body);
      
      // Convert any undefined values to null for Firestore compatibility
      const sanitizedBody = Object.entries(req.body).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? null : value;
        return acc;
      }, {} as Record<string, any>);
      
      const signalData = {
        ...sanitizedBody,
        dateAdded: new Date().toISOString()
      };
      
      console.log('API: Adding signal with sanitized data', signalData);
      
      const docRef = await signalsCollection.add(signalData);
      
      return res.status(201).json({
        success: true,
        data: {
          id: docRef.id,
          ...signalData
        }
      });
    } catch (error: any) {
      console.error('API error creating signal:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // PUT - Update a signal
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Signal ID is required' });
      }
      
      // Convert any undefined values to null for Firestore compatibility
      const sanitizedBody = Object.entries(req.body).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? null : value;
        return acc;
      }, {} as Record<string, any>);
      
      const signalData = {
        ...sanitizedBody,
        updatedAt: new Date().toISOString()
      };
      
      await signalsCollection.doc(id).update(signalData);
      
      return res.status(200).json({
        success: true,
        data: {
          id,
          ...signalData
        }
      });
    } catch (error: any) {
      console.error('API error updating signal:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // DELETE - Delete a signal
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Signal ID is required' });
      }
      
      await signalsCollection.doc(id).delete();
      
      return res.status(200).json({ 
        success: true, 
        data: { message: 'Signal deleted successfully' }
      });
    } catch (error: any) {
      console.error('API error deleting signal:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed',
    method: req.method,
    supportedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });
}