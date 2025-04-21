import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '../../../lib/firebase-admin'; // Adjust path if necessary
import { DecodedIdToken } from 'firebase-admin/auth';

interface ErrorResponse {
  message: string;
}

// Define a type for the successful user response (could be extended)
type UserResponse = DecodedIdToken;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean, user: UserResponse } | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log(`API: /api/auth/user - Method Not Allowed: ${req.method}`);
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get the Authorization header
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    console.log('API: /api/auth/user - Authorization header missing');
    return res.status(401).json({ message: 'Authorization header required' });
  }

  // Check if the header format is Bearer <token>
  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('API: /api/auth/user - Invalid Authorization header format');
    return res.status(401).json({ message: 'Invalid Authorization header format. Use Bearer <token>.' });
  }

  const idToken = parts[1];

  try {
    console.log('API: /api/auth/user - Verifying token...');
    const adminAuth = getAdminAuth(); // Get the initialized auth instance
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log('API: /api/auth/user - Token verified successfully for UID:', decodedToken.uid);

    // Token is valid, send back user information in the expected structure
    return res.status(200).json({ success: true, user: decodedToken });

  } catch (error: any) {
    console.error('API: /api/auth/user - Error verifying token:', error);
    // Determine the specific error type if needed, otherwise return a generic unauthorized error
    let errorMessage = 'Failed to authenticate token.';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token has expired.';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid token provided.';
    }
    // Add more specific error handling based on Firebase error codes if necessary

    return res.status(401).json({ message: errorMessage });
  }
}
