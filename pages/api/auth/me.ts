import type { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth } from '@/lib/firebase-admin';

type UserResponse = {
  success: boolean;
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  };
  error?: string;
}

/**
 * Server-side get current user endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse>
) {
  // Only allow GET method for getting user info
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    try {
      // Verify the token
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Get user record from Firebase Auth
      const userRecord = await adminAuth.getUser(decodedToken.uid);
      
      // Return user info
      return res.status(200).json({
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || undefined,
          photoURL: userRecord.photoURL || undefined
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ success: false, error: 'Error getting user info' });
  }
}