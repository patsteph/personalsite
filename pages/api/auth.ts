import type { NextApiRequest, NextApiResponse } from 'next';
// Import Firebase Admin SDK components
import { initializeAdminApp, getAdminAuth } from '@/lib/firebase-admin'; 
import { DecodedIdToken } from 'firebase-admin/auth'; 
import { Auth as AdminAuth } from 'firebase-admin/auth'; // Import the type
import { serialize } from 'cookie';

// Helper function to initialize and get auth instance ONCE per request handler invocation
// This avoids re-initialization if the same serverless instance handles multiple requests,
// but ensures initialization happens within the request context.
let memoizedAdminAuth: AdminAuth | null = null;
function ensureAdminAuthInitialized(): AdminAuth {
  if (memoizedAdminAuth) {
    return memoizedAdminAuth;
  }
  try {
    console.log('Auth API: Initializing Firebase Admin within handler...');
    initializeAdminApp(); // Initialize (safe if already initialized)
    memoizedAdminAuth = getAdminAuth();
    console.log('Auth API: Firebase Admin initialized successfully within handler.');
    if (!memoizedAdminAuth) { // Should not happen if getAdminAuth() works
      throw new Error('getAdminAuth() returned null after initialization.');
    }
    return memoizedAdminAuth;
  } catch (initError: any) {
    console.error('Auth API: CRITICAL FIREBASE INIT ERROR during request:', initError);
    throw new Error('Auth service unavailable due to initialization failure.'); // Re-throw to be caught by handler
  }
}

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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  let adminAuth: AdminAuth;
  try {
    adminAuth = ensureAdminAuthInitialized();
  } catch (error: any) {
    console.error('Auth API: Handler failed to get initialized adminAuth instance.');
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error: Auth service failed to initialize.' });
  }
  
  // Check if Firebase Admin SDK initialized successfully
  // This check might be redundant now due to the try/catch above, but safe to keep
  if (!adminAuth) {
    console.error('Auth API: Handler entered but Firebase Admin SDK failed to initialize.');
    return res.status(500).json({ success: false, error: 'Internal Server Error: Auth service unavailable.' });
  }

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
  // **** Login is now handled entirely by the Firebase Client SDK ****
  // **** This backend endpoint should no longer be called for login ****
  return res.status(405).json({ success: false, error: 'Login via this API endpoint is disabled. Use Firebase Client SDK.' });

  /* Commenting out previous logic:
  let adminAuth: AdminAuth;
  try {
    adminAuth = ensureAdminAuthInitialized();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error: Auth service failed to initialize.' });
  }

  // Check if Firebase Admin SDK initialized successfully at the start of the function
  if (!adminAuth) {
    console.error('Auth API (handleLogin): Firebase Admin SDK not initialized.');
    return res.status(500).json({ success: false, error: 'Internal Server Error: Auth service unavailable.' });
  }

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
  */
}

/**
 * Validate a token
 */
async function validateToken(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  let adminAuth: AdminAuth;
  try {
    adminAuth = ensureAdminAuthInitialized();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error: Auth service failed to initialize.' });
  }

  // Check if Firebase Admin SDK initialized successfully
  if (!adminAuth) {
    console.error('Auth API (validateToken): Firebase Admin SDK not initialized.');
    return res.status(500).json({ success: false, error: 'Internal Server Error: Auth service unavailable.' });
  }

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
  let adminAuth: AdminAuth;
  try {
    adminAuth = ensureAdminAuthInitialized();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error: Auth service failed to initialize.' });
  }

  // Check if Firebase Admin SDK initialized successfully
  if (!adminAuth) {
    console.error('Auth API (getCurrentUser): Firebase Admin SDK not initialized.');
    return res.status(500).json({ success: false, error: 'Internal Server Error: Auth service unavailable.' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    try {
      // Verify the token using Firebase Admin SDK
      const decodedToken: DecodedIdToken = await adminAuth.verifyIdToken(token);
      
      if (!decodedToken || !decodedToken.uid) {
        console.warn('Token decoded but UID missing.');
        return res.status(401).json({ success: false, error: 'Invalid token data' });
      }
      
      // Get user record from Firebase Auth using Admin SDK
      const userRecord = await adminAuth.getUser(decodedToken.uid);
      
      if (!userRecord) {
        console.warn(`User record not found for UID: ${decodedToken.uid}`);
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Check if the user is an admin
      const isAdmin = (process.env.ADMIN_EMAILS?.split(',') || []).includes(userRecord.email || '');
      // Return user info
      return res.status(200).json({
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email || '',
          displayName: userRecord.displayName || undefined,
          photoURL: userRecord.photoURL || undefined,
          isAdmin, // Use the determined isAdmin status
        },
      });
    } catch (error: any) {
      console.error('Error verifying token or getting user record:', error);
      // Differentiate between invalid token and other errors
      if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
      } 
      return res.status(500).json({ success: false, error: 'Failed to get user data' });
    }
  } catch (error) {
    console.error('API user fetch error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}