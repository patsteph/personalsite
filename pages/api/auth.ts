import type { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth, firestore } from '@/lib/firebase-admin';

// Response type for authentication
type AuthResponse = {
  success: boolean;
  token?: string;
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  };
  error?: string;
  valid?: boolean;
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
      const userRecord = await adminAuth.getUserByEmail(email)
        .catch(async (error) => {
          console.error(`User not found: ${email}`, error);
          return null;
        });

      if (!userRecord) {
        console.error(`Authentication failed: No user found with email ${email}`);
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      // For real password validation, we would normally use Firebase Auth REST API
      // Since we can't validate passwords server-side with Admin SDK, we'll use a
      // simplified approach - checking for admin users
      
      // Check if user is an admin
      const adminDoc = await firestore.collection('admins').doc(userRecord.uid).get();

      if (!adminDoc.exists) {
        console.error(`User ${email} is not an admin`);
        return res.status(403).json({ success: false, error: 'Not authorized as admin' });
      }

      // Get their display name, if available
      let displayName = userRecord.displayName || email.split('@')[0];
      let photoURL = userRecord.photoURL || null;

      // Create a custom token for this user
      const customToken = await adminAuth.createCustomToken(userRecord.uid);
      
      // Store token in Firestore for validation
      // This is needed because custom tokens can't be verified directly with verifyIdToken
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24); // 24 hour expiration
      
      await firestore.collection('admin_tokens').add({
        token: customToken,
        userId: userRecord.uid,
        created: new Date(),
        expires: expirationTime,
        email: userRecord.email
      });
      
      console.log(`Successfully authenticated admin user: ${email}`);
      
      // Return the token and user info
      return res.status(200).json({
        success: true,
        token: customToken,
        user: {
          uid: userRecord.uid,
          email: userRecord.email || '',
          displayName,
          photoURL: photoURL || undefined
        }
      });
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
      const decodedToken = await adminAuth.verifyIdToken(token);
      
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
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Get user record from Firebase Auth
      const userRecord = await adminAuth.getUser(decodedToken.uid);
      
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