import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '@/lib/firebase-admin';

type ValidateResponse = {
  success: boolean;
  valid?: boolean;
  error?: string;
}

/**
 * Server-side token validation endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidateResponse>
) {
  // Only allow POST method for token validation
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!token) {
      return res.status(401).json({ success: false, valid: false, error: 'No token provided' });
    }

    try {
      const auth = getAdminAuth();
      await auth.verifyIdToken(token);
      return res.status(200).json({ success: true, valid: true });
    } catch (error) {
      return res.status(401).json({ success: false, valid: false, error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error validating token'
    });
  }
}
