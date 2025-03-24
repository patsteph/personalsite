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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers for all requests
  setCorsHeaders(res);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }

  // Log all requests
  console.log(`API Request: ${req.method} ${req.url}`);
  console.log('Request headers:', JSON.stringify(req.headers));
  
  // Log the origin of the request to debug CORS issues
  const origin = req.headers.origin || req.headers.referer || 'unknown';
  console.log(`Request origin: ${origin}`);
  
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
  
  // All other methods require authentication
  try {
    // For authenticated methods, check the request method
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
      console.warn(`Invalid method: ${req.method}`);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
    
    // Validate Firebase ID token
    console.log('Validating Firebase ID token');
    const userId = await validateFirebaseIdToken(req);
    if (!userId) {
      console.warn('Authentication failed: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('Authentication successful for user:', userId);
    
    // Handle POST request (create a new signal)
    if (req.method === 'POST') {
      // Log for debugging
      console.log('POST request received');
      try {
        console.log('POST request body:', JSON.stringify(req.body));
      } catch (err) {
        console.error('Error parsing POST body:', err);
      }
      
      try {
        const { shareToSocial, ...signalData } = req.body;
        
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
        return res.status(500).json({ error: 'Error processing request' });
      }
    }
    
    // Handle PUT request (update a signal)
    if (req.method === 'PUT') {
      // Log for debugging
      console.log('PUT request received');
      try {
        console.log('PUT request body:', JSON.stringify(req.body));
      } catch (err) {
        console.error('Error parsing PUT body:', err);
      }
      
      try {
        const { id, shareToSocial, ...signalData } = req.body;
        
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
        return res.status(500).json({ error: 'Error processing request' });
      }
    }
    
    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing signal ID' });
      }
      
      const success = await signalsApi.deleteSignal(id as string);
      if (!success) {
        return res.status(500).json({ error: 'Error deleting signal' });
      }
      
      return res.status(200).json({ success: true });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in signals API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}