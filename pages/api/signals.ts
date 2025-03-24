/**
 * Signals API endpoint
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import * as signalsApi from '@/lib/api/signals';
import { shareToSocialMedia } from '@/lib/socialShare';
import { Signal } from '@/types';

// Helper function to add CORS headers
const setCorsHeaders = (res: NextApiResponse) => {
  // Allow credentials
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // Be more specific with allowed origins in production
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Specify all allowed methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // Allow all necessary headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  // Allow cache for preflight requests (improves performance)
  res.setHeader('Access-Control-Max-Age', '86400');
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers for all requests
  setCorsHeaders(res);
  
  // Handle CORS preflight requests - must come first
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  // Log all requests
  console.log(`API Request: ${req.method} ${req.url}`);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  // Log the origin of the request to debug CORS issues
  const origin = req.headers.origin || req.headers.referer || 'unknown';
  console.log(`Request origin: ${origin}`);
  console.log('Request body type:', typeof req.body);

  try {
    // Dump request body if available
    if (req.body) {
      try {
        console.log('Request body:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2));
      } catch (error) {
        console.log('Could not stringify request body:', error);
      }
    }
  } catch (error) {
    console.log('Error accessing request body:', error);
  }
  
  // Handle GET requests (public data)
  if (req.method === 'GET') {
    const { type, featured, limit, tag } = req.query;
    
    // Log for debugging
    console.log('GET request received with query:', req.query);
    
    try {
      const options: any = {};
      
      if (type === 'newsletter' || type === 'article') {
        options.type = type;
      }
      
      if (featured === 'true') {
        options.featured = true;
      } else if (featured === 'false') {
        options.featured = false;
      }
      
      if (limit && !isNaN(Number(limit))) {
        options.limit = Number(limit);
      }
      
      if (tag) {
        options.tags = [tag as string];
      }
      
      console.log('Fetching signals with options:', options);
      const signals = await signalsApi.getAllSignals(options);
      console.log(`Retrieved ${signals.length} signals`);
      
      return res.status(200).json({ signals });
    } catch (error) {
      console.error('Error fetching signals:', error);
      return res.status(500).json({ error: 'Error fetching signals' });
    }
  }
  
  // Handle POST request (create a new signal)
  if (req.method === 'POST') {
    console.log('POST request received');
    
    // Validate Firebase ID token
    console.log('Validating Firebase ID token for POST');
    try {
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        console.warn('Authentication failed for POST: Invalid or missing token');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      console.log('Authentication successful for user:', userId);
      
      try {
        // Ensure request body is parsed correctly
        let signalData;
        let shareToSocial;
        
        if (typeof req.body === 'string') {
          const parsedBody = JSON.parse(req.body);
          shareToSocial = parsedBody.shareToSocial;
          signalData = { ...parsedBody };
          delete signalData.shareToSocial;
        } else {
          shareToSocial = req.body.shareToSocial;
          signalData = { ...req.body };
          delete signalData.shareToSocial;
        }
        
        // Validate the required fields
        if (!signalData || !signalData.title || !signalData.type) {
          console.error('Missing required fields in POST request');
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        console.log('Creating signal with data:', {
          title: signalData.title,
          type: signalData.type
        });
        
        const signalId = await signalsApi.createSignal(signalData);
        if (!signalId) {
          console.error('Error creating signal in API');
          return res.status(500).json({ error: 'Error creating signal' });
        }
        
        console.log('Signal created successfully with ID:', signalId);
        
        // Handle social media sharing if requested
        let socialShareResults = {};
        if (shareToSocial) {
          try {
            socialShareResults = await shareToSocialMedia(
              {
                title: signalData.title,
                description: signalData.description,
                url: signalData.url,
                imageUrl: signalData.imageUrl
              },
              {
                linkedin: shareToSocial.linkedin,
                twitter: shareToSocial.twitter,
                bluesky: shareToSocial.bluesky
              }
            );
          } catch (error) {
            console.error('Error sharing to social media:', error);
            // We continue even if social sharing fails
          }
        }
        
        return res.status(201).json({ id: signalId, socialShareResults });
      } catch (error) {
        console.error('Error processing POST request:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Stack trace:', error.stack);
        }
        return res.status(500).json({ error: 'Error processing request' });
      }
    } catch (authError) {
      console.error('Auth error in POST:', authError);
      return res.status(401).json({ error: 'Authentication error' });
    }
  }
  
  // Handle PUT request (update a signal)
  if (req.method === 'PUT') {
    console.log('PUT request received');
    
    // Validate Firebase ID token
    console.log('Validating Firebase ID token for PUT');
    try {
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        console.warn('Authentication failed for PUT: Invalid or missing token');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      console.log('Authentication successful for user:', userId);
      
      try {
        // Ensure request body is parsed correctly
        let signalData;
        let shareToSocial;
        let id;
        
        if (typeof req.body === 'string') {
          const parsedBody = JSON.parse(req.body);
          id = parsedBody.id;
          shareToSocial = parsedBody.shareToSocial;
          signalData = { ...parsedBody };
          delete signalData.shareToSocial;
          delete signalData.id;
        } else {
          id = req.body.id;
          shareToSocial = req.body.shareToSocial;
          signalData = { ...req.body };
          delete signalData.shareToSocial;
          delete signalData.id;
        }
        
        if (!id) {
          console.error('Missing signal ID in PUT request');
          return res.status(400).json({ error: 'Missing signal ID' });
        }
        
        console.log('Updating signal with ID:', id);
        
        const success = await signalsApi.updateSignal(id, signalData);
        if (!success) {
          console.error('Error updating signal:', id);
          return res.status(500).json({ error: 'Error updating signal' });
        }
        
        console.log('Signal updated successfully with ID:', id);
        
        // Handle social media sharing if requested
        let socialShareResults = {};
        if (shareToSocial) {
          try {
            socialShareResults = await shareToSocialMedia(
              {
                title: signalData.title,
                description: signalData.description,
                url: signalData.url,
                imageUrl: signalData.imageUrl
              },
              {
                linkedin: shareToSocial.linkedin,
                twitter: shareToSocial.twitter,
                bluesky: shareToSocial.bluesky
              }
            );
          } catch (error) {
            console.error('Error sharing to social media:', error);
            // We continue even if social sharing fails
          }
        }
        
        return res.status(200).json({ success: true, socialShareResults });
      } catch (error) {
        console.error('Error processing PUT request:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Stack trace:', error.stack);
        }
        return res.status(500).json({ error: 'Error processing request' });
      }
    } catch (authError) {
      console.error('Auth error in PUT:', authError);
      return res.status(401).json({ error: 'Authentication error' });
    }
  }
  
  // Handle DELETE request
  if (req.method === 'DELETE') {
    // Validate Firebase ID token
    console.log('Validating Firebase ID token for DELETE');
    try {
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        console.warn('Authentication failed for DELETE: Invalid or missing token');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      console.log('Authentication successful for user:', userId);
      
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing signal ID' });
      }
      
      const success = await signalsApi.deleteSignal(id as string);
      if (!success) {
        return res.status(500).json({ error: 'Error deleting signal' });
      }
      
      return res.status(200).json({ success: true });
    } catch (authError) {
      console.error('Auth error in DELETE:', authError);
      return res.status(401).json({ error: 'Authentication error' });
    }
  }
  
  // Handle unsupported methods
  console.warn(`Method not allowed: ${req.method}`);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}