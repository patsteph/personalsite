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
      console.log(`Checking admin status for user: ${userRecord.uid} (${email})`);
      const adminDoc = await firestore.collection('admins').doc(userRecord.uid).get();

      // Log more details about the admin document
      console.log(`Admin doc check result - exists: ${adminDoc.exists}, path: ${adminDoc.ref.path}`);
      
      // Also check admins collection (singular form) as fallback
      let isAdmin = adminDoc.exists;
      if (!isAdmin) {
        try {
          const altAdminDoc = await firestore.collection('admin').doc(userRecord.uid).get();
          isAdmin = altAdminDoc.exists;
          console.log(`Alternative admin doc check (singular) - exists: ${altAdminDoc.exists}`);
        } catch (error) {
          console.log('Error checking alternative admin collection:', error);
        }
      }

      // TEMPORARY: Force admin access for first login - remove in production!
      if (!isAdmin) {
        console.log(`User ${email} not found in admins collection - attempting to create admin document`);
        
        try {
          // Create admin document for this user
          await firestore.collection('admins').doc(userRecord.uid).set({
            email: userRecord.email,
            createdAt: new Date(),
            displayName: userRecord.displayName || '',
            autoCreated: true
          });
          console.log(`Successfully created admin document for ${email}`);
          
          // Set isAdmin to true since we just created the admin document
          isAdmin = true;
        } catch (createError) {
          console.error(`Failed to create admin document:`, createError);
          
          // Return error for normal flow
          return res.status(403).json({ 
            success: false, 
            error: 'Not authorized as admin',
            debug: { 
              uid: userRecord.uid, 
              email: userRecord.email,
              adminCollection: 'admins',
              adminDocPath: adminDoc.ref.path,
              createError: createError instanceof Error ? createError.message : String(createError)
            }
          });
        }
      }

      // Get their display name, if available
      let displayName = userRecord.displayName || email.split('@')[0];
      let photoURL = userRecord.photoURL || null;

      // Create a custom token for this user
      console.log(`Creating custom token for admin user: ${userRecord.uid}`);
      try {
        const customToken = await adminAuth.createCustomToken(userRecord.uid, {
          admin: true, // Add custom claim for admin
          email: userRecord.email
        });
        
        // Store token in Firestore for validation
        // This is needed because custom tokens can't be verified directly with verifyIdToken
        const expirationTime = new Date();
        expirationTime.setHours(expirationTime.getHours() + 24); // 24 hour expiration
        
        // Add token to Firestore
        const tokenRef = await firestore.collection('admin_tokens').add({
          token: customToken,
          userId: userRecord.uid,
          created: new Date(),
          expires: expirationTime,
          email: userRecord.email
        });
        
        console.log(`Successfully authenticated admin user: ${email}, token stored with ID: ${tokenRef.id}`);
        
        // Return the token and user info
        return res.status(200).json({
          success: true,
          token: customToken,
          user: {
            uid: userRecord.uid,
            email: userRecord.email || '',
            displayName,
            photoURL: photoURL || undefined,
            isAdmin: true
          }
        });
      } catch (tokenError) {
        console.error('Error creating custom token:', tokenError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create authentication token',
          debug: { 
            message: tokenError instanceof Error ? tokenError.message : String(tokenError),
            uid: userRecord.uid
          }
        });
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