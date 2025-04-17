/**
 * Universal content items API using EXACTLY the same pattern as books-direct
 * This is an endpoint for signals but with a completely different name to avoid middleware
 */
import type { NextApiRequest, NextApiResponse } from 'next';
// Removed Firestore import. Use server-side API or stubbed logic.
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
  
  // TODO: Replace with server-side API logic for content items
  // Placeholder: always succeed
  // End placeholder
  // Simulate successful response
  return res.status(200).json({ success: true, data: [] });
  
  // // Use Firestore Admin instance
  // if (!firestore) {
  //   return res.status(500).json({ 
  //     success: false, 
  //     error: 'Firestore not initialized' 
  //   });
  // }
  
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
        // TODO: Replace with server-side API call to fetch a single signal
        // Placeholder: Simulate found signal
        return res.status(200).json({
          success: true,
          data: {
            id,
            name: 'Stubbed Signal',
            value: 'Stubbed Value'
          }
        });
      } else {
        // TODO: Replace with server-side API call to fetch all signals
        // Placeholder: Simulate signal list
        return res.status(200).json({
          success: true,
          data: [
            { id: 'stubbed-signal-1', name: 'Stubbed Signal 1', value: 'Value 1' },
            { id: 'stubbed-signal-2', name: 'Stubbed Signal 2', value: 'Value 2' }
          ]
        });
      }
    }
    
    // Handle POST request (create)
    if (req.method === 'POST') {
      // TODO: Replace with server-side API call to create a new signal
      // Placeholder: Simulate created signal
      const signalData = req.body;
      if (!signalData.createdAt) signalData.createdAt = new Date().toISOString();
      if (!signalData.updatedAt) signalData.updatedAt = new Date().toISOString();
      return res.status(201).json({ success: true, data: { id: 'stubbed-signal-id', ...signalData } });
    }

    // Handle PUT request (update)
    if (req.method === 'PUT') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Signal ID is required for update' });
      }
      // TODO: Replace with server-side API call to update a signal
      // Placeholder: Simulate updated signal
      return res.status(200).json({ success: true, data: { id, ...req.body, updatedAt: new Date().toISOString() } });
    }
    
    // Handle DELETE request
    if (req.method === 'DELETE') {
      return res.status(200).json({ success: true, data: { id: 'stubbed-signal-id' } });
    }
    
    // If we get here, method not supported but respond nicely
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed in content-items endpoint` });
    
  } catch (error: any) {
    console.error('Error in content-items API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}