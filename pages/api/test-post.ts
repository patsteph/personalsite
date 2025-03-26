/**
 * Simple test endpoint to diagnose API method issues
 */
import type { NextApiRequest, NextApiResponse } from 'next';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Handle POST
  if (req.method === 'POST') {
    console.log('Handling POST request');
    console.log('Request body:', req.body);
    
    return res.status(200).json({
      success: true,
      message: 'POST request received successfully',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle GET
  if (req.method === 'GET') {
    console.log('Handling GET request');
    
    return res.status(200).json({
      success: true,
      message: 'GET request received successfully',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default response for other methods
  console.log('Unhandled method:', req.method);
  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed`,
    allowedMethods: ['GET', 'POST', 'OPTIONS']
  });
}
