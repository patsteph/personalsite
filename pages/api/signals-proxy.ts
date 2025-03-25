/**
 * Signals Proxy API - This endpoint works as a proxy to redirect API requests
 * through the client's current origin to avoid CORS issues with hardcoded URLs
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import * as signalsApi from '@/lib/api/signals';
import { shareToSocialMedia } from '@/lib/socialShare';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('PROXY API:', req.method, req.url);
  console.log('Request headers:', JSON.stringify(req.headers));
  
  // Log request body for debugging (redact sensitive information)
  if (req.body) {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('Request body:', { ...body, auth: body.auth ? '[REDACTED]' : undefined });
    } catch (error) {
      console.error('Error parsing request body:', error);
      console.log('Raw request body type:', typeof req.body);
      console.log('Raw request body:', req.body);
    }
  }

  // Add CORS headers - with explicit content type
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Always set content type for non-OPTIONS requests
  if (req.method !== 'OPTIONS') {
    res.setHeader('Content-Type', 'application/json');
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  // GET method for listing signals
  if (req.method === 'GET') {
    try {
      const { type, featured, limit, tag } = req.query;
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
      
      const signals = await signalsApi.getAllSignals(options);
      return res.status(200).json({ signals });
    } catch (error) {
      console.error('PROXY ERROR:', error);
      return res.status(500).json({ error: 'Error fetching signals' });
    }
  }

  // POST method for creating signals
  if (req.method === 'POST') {
    try {
      console.log('Handling POST request to create signal');
      
      // Authenticate
      console.log('Validating Firebase ID token');
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        console.error('Authentication failed - no valid token');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log('Authentication successful, user ID:', userId);

      // Parse body
      let signalData, shareToSocial;
      try {
        const parsedBody = typeof req.body === 'string' 
          ? JSON.parse(req.body) 
          : req.body;
        
        console.log('Parsed request body successfully');
        ({ shareToSocial, ...signalData } = parsedBody);
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return res.status(400).json({ error: 'Invalid request body format' });
      }

      // Validate
      console.log('Validating signal data');
      if (!signalData || !signalData.title || !signalData.type) {
        console.error('Missing required fields in signal data');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create signal
      console.log('Creating signal with data:', {
        ...signalData,
        title: signalData.title,
        type: signalData.type
      });
      
      try {
        const signalId = await signalsApi.createSignal(signalData);
        if (!signalId) {
          console.error('Signal creation returned null ID');
          return res.status(500).json({ error: 'Error creating signal' });
        }
        console.log('Signal created successfully with ID:', signalId);
        
        // Handle social sharing
        let socialShareResults = {};
        if (shareToSocial) {
          console.log('Processing social sharing');
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
            console.log('Social sharing completed:', socialShareResults);
          } catch (shareError) {
            console.error('Error sharing to social media:', shareError);
          }
        }

        console.log('Returning successful response');
        return res.status(201).json({ id: signalId, socialShareResults });
      } catch (createError) {
        console.error('Error in signalsApi.createSignal:', createError);
        if (createError instanceof Error) {
          console.error('Error message:', createError.message);
          console.error('Error stack:', createError.stack);
        }
        return res.status(500).json({ 
          error: 'Error creating signal', 
          message: createError instanceof Error ? createError.message : String(createError) 
        });
      }
    } catch (error) {
      console.error('PROXY POST ERROR:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return res.status(500).json({ 
        error: 'Error processing request',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // PUT method for updating signals
  if (req.method === 'PUT') {
    try {
      // Authenticate
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Parse body
      const parsedBody = typeof req.body === 'string' 
        ? JSON.parse(req.body) 
        : req.body;
        
      const { id, shareToSocial, ...signalData } = parsedBody;

      // Validate
      if (!id) {
        return res.status(400).json({ error: 'Missing signal ID' });
      }

      // Update signal
      const success = await signalsApi.updateSignal(id, signalData);
      if (!success) {
        return res.status(500).json({ error: 'Error updating signal' });
      }

      // Handle social sharing
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
        }
      }

      return res.status(200).json({ success: true, socialShareResults });
    } catch (error) {
      console.error('PROXY PUT ERROR:', error);
      return res.status(500).json({ error: 'Error processing request' });
    }
  }

  // DELETE method for deleting signals
  if (req.method === 'DELETE') {
    try {
      // Authenticate
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get ID from query
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Missing signal ID' });
      }

      // Delete signal
      const success = await signalsApi.deleteSignal(id as string);
      if (!success) {
        return res.status(500).json({ error: 'Error deleting signal' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('PROXY DELETE ERROR:', error);
      return res.status(500).json({ error: 'Error processing request' });
    }
  }

  // If we get here, forward the request to the test-post endpoint for debugging
  // This ensures all methods are handled even if not explicitly supported above
  console.log(`No explicit handler for method ${req.method}, forwarding to test-post endpoint`);
  
  try {
    // Import the test-post handler dynamically
    const testPostHandler = require('./test-post').default;
    
    // Call the test-post handler with the current request and response
    return testPostHandler(req, res);
  } catch (error) {
    console.error('Error forwarding to test-post:', error);
    
    // Fallback response if forwarding fails
    return res.status(200).json({ 
      success: true,
      message: `Request received but no specific handler for method ${req.method}`,
      fallback: true,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  }
}