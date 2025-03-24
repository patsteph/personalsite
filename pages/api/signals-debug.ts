/**
 * Debug endpoint for signals API with mock data
 * This endpoint helps diagnose issues with the signals API and provides mock data
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import { Signal } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log everything
  console.log('SIGNALS DEBUG API:', req.method, req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Query:', JSON.stringify(req.query));
  
  // Try to parse and log the body
  let parsedBody = req.body;
  if (typeof req.body === 'string') {
    try {
      parsedBody = JSON.parse(req.body);
    } catch (e) {
      console.error('Error parsing request body as JSON:', e);
    }
  }
  console.log('Body:', parsedBody ? JSON.stringify(parsedBody) : 'No body');
  
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
  
  // Handle different HTTP methods with mock data
  const debugInfo = {
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
  };
  
  // Handle POST (Create signal)
  if (req.method === 'POST') {
    // Generate mock ID
    const signalId = `debug-signal-${Date.now()}`;
    
    // Extract social sharing if present
    const { shareToSocial, ...signalData } = parsedBody || {};
    const socialShareResults = shareToSocial ? {
      linkedin: 'success',
      twitter: 'success',
      bluesky: 'success'
    } : {};
    
    return res.status(201).json({
      success: true,
      message: 'Signal created successfully (debug mode)',
      id: signalId,
      signal: {
        id: signalId,
        ...signalData,
        dateAdded: new Date().toISOString(),
      },
      socialShareResults,
      ...debugInfo
    });
  }
  
  // Handle GET (List signals)
  if (req.method === 'GET') {
    const { id, type, featured, limit, tag } = req.query;
    
    if (id) {
      // Return a mock signal for the given ID
      return res.status(200).json({
        success: true,
        signal: {
          id,
          title: 'Debug Signal',
          type: 'newsletter',
          description: 'This is a debug signal',
          dateAdded: new Date().toISOString(),
          featured: true,
          tags: ['debug', 'test']
        },
        ...debugInfo
      });
    } else {
      // Return a list of mock signals
      const signals = [
        {
          id: 'debug-signal-1',
          title: 'Debug Newsletter',
          type: 'newsletter',
          description: 'This is a debug newsletter',
          dateAdded: new Date().toISOString(),
          featured: true,
          tags: ['newsletter', 'debug'],
          publisher: 'Debug Publisher',
          frequency: 'Weekly'
        },
        {
          id: 'debug-signal-2',
          title: 'Debug Article',
          type: 'article',
          description: 'This is a debug article',
          dateAdded: new Date().toISOString(),
          featured: false,
          tags: ['article', 'debug'],
          author: 'Debug Author',
          source: 'Debug Source'
        }
      ];
      
      // Apply filters if provided
      let filteredSignals = signals;
      
      if (type === 'newsletter' || type === 'article') {
        filteredSignals = filteredSignals.filter(s => s.type === type);
      }
      
      if (featured === 'true') {
        filteredSignals = filteredSignals.filter(s => s.featured);
      }
      
      if (tag) {
        filteredSignals = filteredSignals.filter(s => s.tags.includes(tag as string));
      }
      
      if (limit && !isNaN(Number(limit))) {
        filteredSignals = filteredSignals.slice(0, Number(limit));
      }
      
      return res.status(200).json({
        success: true,
        signals: filteredSignals,
        ...debugInfo
      });
    }
  }
  
  // Handle PUT (Update signal)
  if (req.method === 'PUT') {
    const { id, shareToSocial, ...updates } = parsedBody || {};
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Signal ID is required',
        ...debugInfo
      });
    }
    
    // Handle social sharing
    const socialShareResults = shareToSocial ? {
      linkedin: 'success',
      twitter: 'success',
      bluesky: 'success'
    } : {};
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Signal updated successfully (debug mode)',
      signal: {
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      },
      socialShareResults,
      ...debugInfo
    });
  }
  
  // Handle DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Signal ID is required',
        ...debugInfo
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Signal deleted successfully (debug mode)',
      ...debugInfo
    });
  }
  
  // For any other method, return diagnostic information
  return res.status(200).json({
    success: true,
    message: `Debug endpoint reached successfully with method ${req.method}`,
    method: req.method,
    path: req.url,
    ...debugInfo
  });
}