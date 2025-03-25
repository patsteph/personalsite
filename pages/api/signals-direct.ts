/**
 * Simple direct signals API endpoint for debugging
 * This endpoint accepts all HTTP methods and has no authentication
 */
import type { NextApiRequest, NextApiResponse } from 'next';

// Configure the API route
export const config = {
  api: {
    bodyParser: true,
  },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // For all non-OPTIONS responses, set content type
  if (req.method !== 'OPTIONS') {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Log request details
  console.log('SIGNALS DIRECT API:', req.method, req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  
  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log body for non-GET requests
  if (req.method !== 'GET') {
    console.log('Body:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  }
  
  // Generate a timestamp
  const timestamp = new Date().toISOString();
  
  // Handle all requests with success responses
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'GET request successful',
      signals: [
        {
          id: 'direct-signal-1',
          title: 'Direct Test Signal',
          type: 'newsletter',
          description: 'This is a direct test signal',
          dateAdded: timestamp,
          featured: true,
          tags: ['test']
        }
      ]
    });
  }
  
  if (req.method === 'POST') {
    // Generate random ID for new signal
    const signalId = `direct-signal-${Date.now()}`;
    
    return res.status(201).json({
      success: true,
      message: 'Signal created successfully (direct mode)',
      id: signalId,
      signal: {
        id: signalId,
        ...(typeof req.body === 'object' ? req.body : {}),
        dateAdded: timestamp,
      }
    });
  }
  
  if (req.method === 'PUT') {
    // Extract ID from body or query
    const id = typeof req.body === 'object' && req.body.id ? req.body.id : 
               req.query.id ? req.query.id : 'unknown-id';
               
    return res.status(200).json({
      success: true,
      message: 'Signal updated successfully (direct mode)',
      id,
      signal: {
        id,
        ...(typeof req.body === 'object' ? req.body : {}),
        updatedAt: timestamp
      }
    });
  }
  
  if (req.method === 'DELETE') {
    // Extract ID from query or body
    const id = req.query.id ? req.query.id : 
               typeof req.body === 'object' && req.body.id ? req.body.id : 'unknown-id';
               
    return res.status(200).json({
      success: true,
      message: 'Signal deleted successfully (direct mode)',
      id
    });
  }
  
  // Fallback for any other method
  return res.status(200).json({
    success: true,
    message: `${req.method} request handled successfully`,
    timestamp,
    requestedMethod: req.method,
    requestedUrl: req.url
  });
}