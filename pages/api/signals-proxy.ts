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

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
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
      // Authenticate
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Parse body
      const { shareToSocial, ...signalData } = typeof req.body === 'string' 
        ? JSON.parse(req.body) 
        : req.body;

      // Validate
      if (!signalData || !signalData.title || !signalData.type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create signal
      const signalId = await signalsApi.createSignal(signalData);
      if (!signalId) {
        return res.status(500).json({ error: 'Error creating signal' });
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

      return res.status(201).json({ id: signalId, socialShareResults });
    } catch (error) {
      console.error('PROXY POST ERROR:', error);
      return res.status(500).json({ error: 'Error processing request' });
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

  // Fallback for unsupported methods
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}