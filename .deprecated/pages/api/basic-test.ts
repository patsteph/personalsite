/**
 * Basic test endpoint that doesn't use any middleware or complex dependencies
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  // Log everything to help debug
  console.log('BASIC-TEST API called:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    bodyPresent: !!req.body
  });
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Response for GET
  if (req.method === 'GET') {
    console.log('Handling GET request');
    
    return res.status(200).json({
      success: true,
      message: 'Basic test endpoint GET successful',
      timestamp: new Date().toISOString(),
      debug: {
        method: req.method,
        url: req.url,
        headers: req.headers,
      }
    });
  }
  
  // Response for POST
  if (req.method === 'POST') {
    console.log('Handling POST request', req.body);
    
    return res.status(200).json({
      success: true,
      message: 'Basic test endpoint POST successful',
      timestamp: new Date().toISOString(),
      receivedData: req.body || null
    });
  }
  
  // Fallback for other methods
  console.log(`Method ${req.method} not implemented`);
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not implemented`
  });
}