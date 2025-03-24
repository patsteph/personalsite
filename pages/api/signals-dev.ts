/**
 * Signals API endpoint for development environment
 * This is a more verbose and less sophisticated version of the signals API
 * that is used during development to help debug issues.
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
  // Log all incoming requests in detail
  console.log('==========================================');
  console.log(`SIGNALS DEV API - ${req.method} ${req.url}`);
  console.log('------------------------------------------');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('------------------------------------------');
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('------------------------------------------');
  console.log('Body:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2));
  console.log('==========================================');

  // Add CORS headers for all requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('DEV API: Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  // Handle GET requests (public data)
  if (req.method === 'GET') {
    try {
      console.log('DEV API: Processing GET request');
      
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
      
      console.log('DEV API: Fetching signals with options:', options);
      const signals = await signalsApi.getAllSignals(options);
      console.log(`DEV API: Retrieved ${signals.length} signals`);
      
      return res.status(200).json({ signals });
    } catch (error) {
      console.error('DEV API ERROR - GET:', error);
      return res.status(500).json({ error: 'Error fetching signals' });
    }
  }
  
  // Handle POST request (create a new signal)
  if (req.method === 'POST') {
    try {
      console.log('DEV API: Processing POST request');
      
      // Validate Firebase ID token
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        console.warn('DEV API: Authentication failed - Invalid or missing token');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      console.log('DEV API: User authenticated:', userId);
      
      // Parse request body if needed
      let parsedBody;
      if (typeof req.body === 'string') {
        try {
          parsedBody = JSON.parse(req.body);
        } catch (e) {
          console.error('DEV API: Error parsing string body:', e);
          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
      } else {
        parsedBody = req.body;
      }
      
      // Extract data
      const { shareToSocial, ...signalData } = parsedBody;
      
      // Validate required fields
      if (!signalData || !signalData.title || !signalData.type) {
        console.error('DEV API: Missing required fields');
        return res.status(400).json({ error: 'Missing required fields (title and type are required)' });
      }
      
      // Create the signal
      console.log('DEV API: Creating signal:', {
        title: signalData.title,
        type: signalData.type
      });
      
      const signalId = await signalsApi.createSignal(signalData);
      if (!signalId) {
        console.error('DEV API: Error creating signal in database');
        return res.status(500).json({ error: 'Error creating signal' });
      }
      
      console.log('DEV API: Signal created successfully with ID:', signalId);
      
      // Handle social sharing if requested
      let socialShareResults = {};
      if (shareToSocial) {
        console.log('DEV API: Social sharing requested:', shareToSocial);
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
          console.log('DEV API: Social sharing results:', socialShareResults);
        } catch (error) {
          console.error('DEV API: Error sharing to social media:', error);
        }
      }
      
      return res.status(201).json({ id: signalId, socialShareResults });
    } catch (error) {
      console.error('DEV API ERROR - POST:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
      }
      return res.status(500).json({ error: 'Server error processing request' });
    }
  }
  
  // Handle PUT request (update a signal)
  if (req.method === 'PUT') {
    try {
      console.log('DEV API: Processing PUT request');
      
      // Validate Firebase ID token
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        console.warn('DEV API: Authentication failed - Invalid or missing token');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      console.log('DEV API: User authenticated:', userId);
      
      // Parse request body if needed
      let parsedBody;
      if (typeof req.body === 'string') {
        try {
          parsedBody = JSON.parse(req.body);
        } catch (e) {
          console.error('DEV API: Error parsing string body:', e);
          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
      } else {
        parsedBody = req.body;
      }
      
      // Extract data
      const { id, shareToSocial, ...signalData } = parsedBody;
      
      // Validate ID
      if (!id) {
        console.error('DEV API: Missing signal ID');
        return res.status(400).json({ error: 'Missing signal ID' });
      }
      
      // Update the signal
      console.log('DEV API: Updating signal with ID:', id);
      
      const success = await signalsApi.updateSignal(id, signalData);
      if (!success) {
        console.error('DEV API: Error updating signal in database');
        return res.status(500).json({ error: 'Error updating signal' });
      }
      
      console.log('DEV API: Signal updated successfully with ID:', id);
      
      // Handle social sharing if requested
      let socialShareResults = {};
      if (shareToSocial) {
        console.log('DEV API: Social sharing requested:', shareToSocial);
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
          console.log('DEV API: Social sharing results:', socialShareResults);
        } catch (error) {
          console.error('DEV API: Error sharing to social media:', error);
        }
      }
      
      return res.status(200).json({ success: true, socialShareResults });
    } catch (error) {
      console.error('DEV API ERROR - PUT:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
      }
      return res.status(500).json({ error: 'Server error processing request' });
    }
  }
  
  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      console.log('DEV API: Processing DELETE request');
      
      // Validate Firebase ID token
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        console.warn('DEV API: Authentication failed - Invalid or missing token');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      console.log('DEV API: User authenticated:', userId);
      
      // Get the ID from the query
      const { id } = req.query;
      if (!id) {
        console.error('DEV API: Missing signal ID');
        return res.status(400).json({ error: 'Missing signal ID' });
      }
      
      // Delete the signal
      console.log('DEV API: Deleting signal with ID:', id);
      
      const success = await signalsApi.deleteSignal(id as string);
      if (!success) {
        console.error('DEV API: Error deleting signal in database');
        return res.status(500).json({ error: 'Error deleting signal' });
      }
      
      console.log('DEV API: Signal deleted successfully with ID:', id);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('DEV API ERROR - DELETE:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
      }
      return res.status(500).json({ error: 'Server error processing request' });
    }
  }
  
  // Handle unsupported methods
  console.warn(`DEV API: Method not allowed: ${req.method}`);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}