import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

type SignOutResponse = {
  success: boolean;
  error?: string;
}

/**
 * Server-side sign out endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignOutResponse>
) {
  // Only allow POST method for sign out
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (token) {
      try {
        // Remove token from Firestore
        const tokenQuery = await firestore.collection('admin_tokens')
          .where('token', '==', token)
          .get();
        
        if (!tokenQuery.empty) {
          // Delete all matching tokens
          const batch = firestore.batch();
          tokenQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log('Tokens removed from Firestore during signout');
        }
      } catch (error) {
        console.error('Error removing token from Firestore:', error);
      }
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return res.status(500).json({ success: false, error: 'Error during sign out' });
  }
}