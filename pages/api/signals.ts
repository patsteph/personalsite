import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFirestore, getFirebaseAuth } from '../../lib/firebase-admin';

type SignalResponse = {
  success: boolean;
  data?: any;
  error?: string;
  socialShareResults?: Record<string, 'success' | 'error'>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignalResponse>
) {
  console.log('Signals API:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Initialize Firestore collection early to avoid potential initialization issues
  console.log('Initializing signals collection');
  const signalsCollection = getAdminFirestore().collection('signals');

  switch (req.method) {
    case 'OPTIONS':
      // Handle CORS preflight
      return res.status(200).end();

    case 'GET':
      try {
        console.log('Processing GET request for signals');
        const { id, type } = req.query;

        if (id && typeof id === 'string') {
          console.log(`Getting signal with ID: ${id}`);
          const doc = await signalsCollection.doc(id).get();
          if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Signal not found' });
          }
          return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
        } else if (type && typeof type === 'string') {
          console.log(`Getting signals with type: ${type}`);
          const snapshot = await signalsCollection.where('type', '==', type).get();
          const signals: any[] = [];
          snapshot.forEach(doc => signals.push({ id: doc.id, ...doc.data() }));
          return res.status(200).json({ success: true, data: signals });
        } else {
          console.log('Getting all signals');
          // Ensure Firestore index exists for dateAdded (desc)!
          const snapshot = await signalsCollection.orderBy('dateAdded', 'desc').get();
          const signals: any[] = [];
          snapshot.forEach(doc => signals.push({ id: doc.id, ...doc.data() }));
          return res.status(200).json({ success: true, data: signals });
        }
      } catch (error: any) {
        console.error('API GET /signals error:', error);
        // Specific check for index-related errors (requires more specific error code checking if available)
        if (error.code === 'failed-precondition') {
          console.error('API GET /signals: Possible missing Firestore index for orderBy clause.');
          return res.status(500).json({ success: false, error: `Failed to get signals: ${error.message}. Check Firestore indexes.` });
        }
        return res.status(500).json({ success: false, error: `Failed to get signals: ${error.message}` });
      }

    case 'POST':
    case 'PUT':
    case 'DELETE':
      // All mutating methods require authentication
      try {
        console.log(`Checking authentication for ${req.method} request`);
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.log('No valid authorization header found');
          return res.status(401).json({ success: false, error: 'Unauthorized - No valid auth token' });
        }

        console.log(`API ${req.method} /signals: Attempting authentication...`);
        const token = authHeader.split('Bearer ')[1];
        await getFirebaseAuth().verifyIdToken(token);
        console.log(`API ${req.method} /signals: Authentication successful`);
      } catch (error: any) {
        console.error(`API ${req.method} auth error:`, error);
        return res.status(401).json({ success: false, error: `Authentication error: ${error.message}` });
      }

      // Proceed with method-specific logic after successful authentication
      if (req.method === 'POST') {
        try {
          console.log('Processing POST request to create a signal');
          const { shareToSocial, ...signalData } = req.body;
          const sanitizedBody = Object.entries(signalData).reduce((acc, [key, value]) => {
            acc[key] = value === undefined ? null : value;
            return acc;
          }, {} as Record<string, any>);

          const now = new Date().toISOString();
          const newSignalData = {
            ...sanitizedBody,
            dateAdded: now,
            updatedAt: now
          };

          console.log('Adding signal with sanitized data', newSignalData);
          const docRef = await signalsCollection.add(newSignalData);
          console.log(`Signal created with ID: ${docRef.id}`);

          let socialShareResults: Record<string, 'success' | 'error'> | undefined = undefined;
          if (shareToSocial) {
            socialShareResults = {};
            // TODO: Implement actual social sharing logic
            if (shareToSocial.linkedin) socialShareResults.linkedin = 'success';
            if (shareToSocial.twitter) socialShareResults.twitter = 'success';
            if (shareToSocial.bluesky) socialShareResults.bluesky = 'success';
          }

          return res.status(201).json({
            success: true,
            data: { id: docRef.id, ...newSignalData },
            socialShareResults
          });
        } catch (error: any) {
          console.error('API POST /signals error:', error);
          return res.status(500).json({ success: false, error: `Failed to create signal: ${error.message}` });
        }
      } else if (req.method === 'PUT') {
        try {
          console.log('Processing PUT request to update a signal');
          const { id, shareToSocial, ...signalData } = req.body;

          if (!id) {
            return res.status(400).json({ success: false, error: 'Signal ID is required for update' });
          }

          const sanitizedBody = Object.entries(signalData).reduce((acc, [key, value]) => {
            acc[key] = value === undefined ? null : value;
            return acc;
          }, {} as Record<string, any>);

          delete sanitizedBody.id; // Ensure ID isn't part of the update payload

          const updateData = {
            ...sanitizedBody,
            updatedAt: new Date().toISOString()
          };

          await signalsCollection.doc(id).update(updateData);
          console.log(`Signal with ID ${id} updated successfully`);

          let socialShareResults: Record<string, 'success' | 'error'> | undefined = undefined;
          if (shareToSocial) {
            socialShareResults = {};
            // TODO: Implement actual social sharing logic
            if (shareToSocial.linkedin) socialShareResults.linkedin = 'success';
            if (shareToSocial.twitter) socialShareResults.twitter = 'success';
            if (shareToSocial.bluesky) socialShareResults.bluesky = 'success';
          }

          return res.status(200).json({
            success: true,
            data: { id, ...updateData },
            socialShareResults
          });
        } catch (error: any) {
          console.error('API PUT /signals error:', error);
          return res.status(500).json({ success: false, error: `Failed to update signal: ${error.message}` });
        }
      } else if (req.method === 'DELETE') {
        try {
          console.log('Processing DELETE request');
          const { id } = req.query;

          if (!id || typeof id !== 'string') {
            return res.status(400).json({ success: false, error: 'Signal ID is required in query params for delete' });
          }

          await signalsCollection.doc(id).delete();
          console.log(`Signal with ID ${id} deleted successfully`);

          return res.status(200).json({
            success: true,
            data: { message: 'Signal deleted successfully' }
          });
        } catch (error: any) {
          console.error('API DELETE /signals error:', error);
          return res.status(500).json({ success: false, error: `Failed to delete signal: ${error.message}` });
        }
      }
      // Should not be reached if POST/PUT/DELETE
      break;

    default:
      // If method is not OPTIONS, GET, POST, PUT, DELETE
      console.log(`Method ${req.method} not allowed`);
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
      return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }
}