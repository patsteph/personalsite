/**
 * Signals API endpoint
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import * as signalsApi from '@/lib/api/signals';
import { shareToSocialMedia } from '@/lib/socialShare';
import { Signal } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET requests (public data)
  if (req.method === 'GET') {
    const { type, featured, limit, tag } = req.query;
    
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
      
      const signals = await signalsApi.getAllSignals(options);
      return res.status(200).json({ signals });
    } catch (error) {
      console.error('Error fetching signals:', error);
      return res.status(500).json({ error: 'Error fetching signals' });
    }
  }
  
  // All other methods require authentication
  try {
    // Validate Firebase ID token
    const userId = await validateFirebaseIdToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Handle POST request (create a new signal)
    if (req.method === 'POST') {
      const { shareToSocial, ...signalData } = req.body;
      
      // Validate the required fields
      if (!signalData || !signalData.title || !signalData.type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const signalId = await signalsApi.createSignal(signalData);
      if (!signalId) {
        return res.status(500).json({ error: 'Error creating signal' });
      }
      
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
    }
    
    // Handle PUT request (update a signal)
    if (req.method === 'PUT') {
      const { id, shareToSocial, ...signalData } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing signal ID' });
      }
      
      const success = await signalsApi.updateSignal(id, signalData);
      if (!success) {
        return res.status(500).json({ error: 'Error updating signal' });
      }
      
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