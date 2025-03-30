// pages/api/signals.ts - SIMPLIFIED VERSION
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from '../../lib/firebase-admin';

// Debug incoming requests
console.log('Signals API module loaded - SIMPLIFIED VERSION');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers directly
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  try {
    // Basic functionality just to test GET/POST
    if (req.method === 'GET') {
      // Return dummy data for testing
      return res.status(200).json({
        success: true,
        data: [
          {
            id: '1',
            type: 'newsletter',
            title: 'Test Newsletter',
            description: 'This is a test newsletter',
            url: 'https://test.com',
            dateAdded: new Date().toISOString()
          },
          {
            id: '2',
            type: 'article',
            title: 'Test Article',
            description: 'This is a test article',
            url: 'https://test.com/article',
            dateAdded: new Date().toISOString()
          }
        ]
      });
    } 
    else if (req.method === 'POST') {
      // Just echo back the request body for testing
      return res.status(201).json({
        success: true,
        data: {
          id: 'new-id-' + Date.now(),
          ...req.body,
          dateAdded: new Date().toISOString()
        }
      });
    }
    else {
      // Just return 200 for any other method to test
      return res.status(200).json({
        success: true,
        message: `${req.method} method acknowledged`
      });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message || 'Unknown error'
    });
  }
}