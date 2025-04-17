import type { NextApiRequest, NextApiResponse } from 'next';
// Removed Firestore import. Use server-side API or remove logic.

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
        // TODO: Invalidate token via server-side API call. Firestore logic removed.
      } catch (error) {
        console.error('Error invalidating token:', error);
      }
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return res.status(500).json({ success: false, error: 'Error during sign out' });
  }
}