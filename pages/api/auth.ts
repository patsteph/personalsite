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

      // First check if user exists in Firebase Auth
      // TODO: Replace with server-side API call to get user by email and check password
      // Stubbed logic for authentication
      if (email === 'admin@example.com' && password === 'password') {
        const userRecord = {
          uid: 'stub-uid',
          email,
          displayName: 'Admin User',
          photoURL: ''
        };
        // Stubbed admin check
        const isAdmin = true;
        // Stubbed custom token
        const customToken = 'stub-custom-token';
        // TODO: Replace with server-side API call to store token
        // Skipping token storage, just return stubbed token
        return res.status(200).json({
          success: true,
          token: customToken,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            isAdmin
          }
        });
      } else {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
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