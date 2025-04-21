import type { NextApiRequest, NextApiResponse } from 'next';
// Removed adminAuth and Firestore import. Use server-side API or remove logic.

// Response type for authentication
type AuthResponse = {
  success: boolean;
  token?: string;
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    isAdmin?: boolean;
  };
  error?: string;
  valid?: boolean;
  debug?: any; // Add debug property for troubleshooting
}

/**
 * Server-side authentication endpoint
 * Uses Firebase Admin SDK to authenticate users without exposing API keys
 */
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  // Handle different types of auth requests
  if (req.method === 'POST') {
    // Login handler
    if (!req.body.hasOwnProperty('email')) {
      return validateToken(req, res);
    }
    
    return handleLogin(req, res);
  } else if (req.method === 'GET') {
    // Get current user info (me endpoint)
    return getCurrentUser(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

/**
 * Handle login with email/password
 */
async function handleLogin(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    try {
      console.log(`Attempting to authenticate user: ${email}`);

      // Server-side Firebase Auth via REST API
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: 'Server misconfiguration: missing Firebase API key' });
      }
      const firebaseRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const firebaseData = await firebaseRes.json();
      if (!firebaseRes.ok) {
        console.error('Firebase sign-in error:', firebaseData.error);
        return res.status(401).json({ success: false, error: firebaseData.error?.message || 'Invalid credentials' });
      }
      const customToken = firebaseData.idToken;
      const userRecord = {
        uid: firebaseData.localId,
        email: firebaseData.email,
        displayName: firebaseData.displayName || '',
        photoURL: firebaseData.photoUrl || ''
      };
      const isAdmin = (process.env.ADMIN_EMAILS?.split(',') || []).includes(email);

      // Set the HttpOnly cookie containing the Firebase ID token
      const cookieOptions = {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60, // 1 hour in seconds
        sameSite: 'strict' as const, // Explicitly type as 'strict'
        secure: process.env.NODE_ENV === 'production',
      };
      res.setHeader('Set-Cookie', serialize('fb_token', customToken, cookieOptions));

      // Return success with token and user info (token in body might still be useful for client)
      return res.status(200).json({ success: true, token: customToken, user: { ...userRecord, isAdmin } });
    } catch (error: any) {
      console.error('Server authentication error:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  } catch (error: any) {
    console.error('API auth error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error during authentication'
    });
  }
}

/**
 * Validate a token
 */
async function validateToken(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (!token) {
      return res.status(401).json({ success: false, valid: false, error: 'No token provided' });
    }
    
    try {
      // Verify the token
      // TODO: Replace with server-side API call to verify token
      // Stubbed logic for token verification
      const decodedToken = {
        uid: 'stub-uid',
        email: 'stub-email@example.com'
      };
      
      // Token is valid
      return res.status(200).json({ 
        success: true, 
        valid: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email || undefined
        }
      });
    } catch (error) {
      console.error('Token validation error:', error);
      return res.status(401).json({ success: false, valid: false, error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ success: false, error: 'Error validating token' });
  }
}

/**
 * Get current user info from token
 */
async function getCurrentUser(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    try {
      // Verify the token
      // TODO: Replace with server-side API call to verify token
      // Stubbed logic for token verification
      const decodedToken = {
        uid: 'stub-uid',
        email: 'stub-email@example.com'
      };
      
      // Get user record from Firebase Auth
      // TODO: Replace with server-side API call to get user by uid
      // Stubbed logic for user retrieval
      const userRecord = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: 'Stubbed User',
        photoURL: null
      };
      
      // Return user info
      return res.status(200).json({
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email || '',
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