/**
 * Enhanced test endpoint that actually saves data to Firestore
 * Ultra-simplified for maximum reliability
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  // Log everything
  console.log('TEST-POST API CALLED:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  try {
    // Initialize Firestore collection
    const signalsCollection = firestore.collection('signals');
    
    // Handle POST - Create a new signal
    if (req.method === 'POST') {
      console.log('Handling POST request');
      console.log('Request body:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      
      try {
        // Parse the body if it's a string
        let signalData;
        if (typeof req.body === 'string') {
          signalData = JSON.parse(req.body);
        } else {
          signalData = req.body;
        }
        
        // Set timestamp if not present
        if (!signalData.dateAdded) {
          signalData.dateAdded = new Date().toISOString();
        }
        
        // Convert any undefined values to null for Firestore compatibility
        const sanitizedData = Object.entries(signalData).reduce((acc, [key, value]) => {
          acc[key] = value === undefined ? null : value;
          return acc;
        }, {} as Record<string, any>);
        
        console.log('Adding to Firestore:', sanitizedData);
        
        // Actually save to Firestore
        const docRef = await signalsCollection.add(sanitizedData);
        
        return res.status(201).json({
          success: true,
          message: 'Signal created and saved to Firestore',
          id: docRef.id,
          data: sanitizedData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in POST operation:', error);
        return res.status(500).json({
          success: false, 
          message: 'Error creating signal',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Handle GET - List signals
    if (req.method === 'GET') {
      console.log('Handling GET request');
      
      try {
        // Retrieve signals from Firestore
        const snapshot = await signalsCollection.orderBy('dateAdded', 'desc').limit(10).get();
        const signals: any[] = [];
        
        snapshot.forEach(doc => {
          signals.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return res.status(200).json({
          success: true,
          message: `Retrieved ${signals.length} signals from Firestore`,
          data: signals,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in GET operation:', error);
        return res.status(500).json({
          success: false,
          message: 'Error retrieving signals',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Handle PUT - Update a signal
    if (req.method === 'PUT') {
      console.log('Handling PUT request');
      console.log('Request body:', req.body);
      console.log('Request query:', req.query);
      
      try {
        const { id } = req.query;
        
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ 
            success: false, 
            message: 'Signal ID is required' 
          });
        }
        
        // Parse the body if it's a string
        let updateData;
        if (typeof req.body === 'string') {
          updateData = JSON.parse(req.body);
        } else {
          updateData = req.body;
        }
        
        // Add updated timestamp
        updateData.updatedAt = new Date().toISOString();
        
        // Convert any undefined values to null for Firestore compatibility
        const sanitizedData = Object.entries(updateData).reduce((acc, [key, value]) => {
          acc[key] = value === undefined ? null : value;
          return acc;
        }, {} as Record<string, any>);
        
        // Update the document in Firestore
        await signalsCollection.doc(id).update(sanitizedData);
        
        return res.status(200).json({
          success: true,
          message: 'Signal updated in Firestore',
          id,
          data: sanitizedData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in PUT operation:', error);
        return res.status(500).json({
          success: false,
          message: 'Error updating signal',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Handle DELETE - Delete a signal
    if (req.method === 'DELETE') {
      console.log('Handling DELETE request');
      console.log('Request query:', req.query);
      
      try {
        const { id } = req.query;
        
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ 
            success: false, 
            message: 'Signal ID is required' 
          });
        }
        
        // Delete the document from Firestore
        await signalsCollection.doc(id).delete();
        
        return res.status(200).json({
          success: true,
          message: 'Signal deleted from Firestore',
          id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in DELETE operation:', error);
        return res.status(500).json({
          success: false,
          message: 'Error deleting signal',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Default response for other methods
    console.log('Unhandled method:', req.method);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    });
  } catch (initError) {
    // Handle initialization errors
    console.error('API initialization error:', initError);
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
      error: initError instanceof Error ? initError.message : String(initError)
    });
  }
}
