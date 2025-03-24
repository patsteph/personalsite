/**
 * Simple test endpoint that accepts all HTTP methods for debugging
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log request details
  console.log('TEST POST API:', req.method, req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  
  // Try to log body if present
  if (req.body) {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('Request body:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      console.log('Raw request body:', req.body);
    }
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Set content type for all non-OPTIONS responses
  if (req.method !== 'OPTIONS') {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Parse token from Authorization header
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('Authorization header found');
    const token = authHeader.split('Bearer ')[1];
    console.log('Token length:', token.length);
    userId = 'token-received'; // Just acknowledge we got a token
  }
  
  // Handle all types of requests
  return res.status(200).json({
    success: true,
    message: `Test ${req.method} request successful`,
    method: req.method,
    path: req.url,
    timestamp: new Date().toISOString(),
    authProvided: !!authHeader,
    userId: userId,
    requestBody: req.body,
    query: req.query
  });
}