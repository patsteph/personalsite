/**
 * Debug endpoint for signals API
 * This endpoint helps diagnose issues with the signals API
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log everything
  console.log('SIGNALS DEBUG API:', req.method, req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Query:', JSON.stringify(req.query));
  console.log('Body:', req.body ? JSON.stringify(req.body) : 'No body');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  // Try to validate token if present
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      userId = await validateFirebaseIdToken(req);
      console.log('Token validation result:', userId ? 'Valid token' : 'Invalid token');
    } catch (error) {
      console.error('Error validating token:', error);
    }
  } else {
    console.log('No authorization header or invalid format');
  }
  
  // Return diagnostic information
  return res.status(200).json({
    success: true,
    message: 'Debug endpoint reached successfully',
    method: req.method,
    path: req.url,
    authentication: {
      authHeaderPresent: !!authHeader,
      validToken: !!userId,
      userId: userId || 'Not authenticated'
    },
    serverInfo: {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'Not on Vercel'
    }
  });
}