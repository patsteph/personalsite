import type { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth, firestore } from '@/lib/firebase-admin';

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
    
    // First, try to verify with Firebase
    try {
      await adminAuth.verifyIdToken(token);
      return res.status(200).json({ success: true, valid: true });
    } catch (verifyError) {
      // If standard validation fails, check admin_tokens collection
      try {
        // Look for this token in admin collection
        const tokenSnapshot = await firestore
          .collection('admin_tokens')
          .where('token', '==', token)
          .limit(1)
          .get();
        
        if (!tokenSnapshot.empty) {
          const tokenDoc = tokenSnapshot.docs[0];
          const tokenData = tokenDoc.data();
          
          // Check if the token is expired
          const now = new Date();
          let isExpired = false;
          
          if (tokenData.expires) {
            const expiryDate = tokenData.expires.toDate 
              ? tokenData.expires.toDate() 
              : new Date(tokenData.expires);
            
            isExpired = expiryDate < now;
          }
          
          if (!isExpired) {
            // Validate against Firebase one more time using user ID
            try {
              await adminAuth.getUser(tokenData.userId);
              return res.status(200).json({ success: true, valid: true });
            } catch (userError) {
              return res.status(401).json({ 
                success: false, 
                valid: false, 
                error: 'Invalid user'
              });
            }
          } else {
            // Delete expired token
            await tokenDoc.ref.delete();
            
            return res.status(401).json({ 
              success: false, 
              valid: false, 
              error: 'Token expired'
            });
          }
        } else {
          return res.status(401).json({ 
            success: false, 
            valid: false, 
            error: 'Invalid token'
          });
        }
      } catch (firestoreError) {
        console.error('Error checking token in Firestore:', firestoreError);
        return res.status(401).json({ 
          success: false, 
          valid: false, 
          error: 'Error validating token'
        });
      }
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error validating token'
    });
  }
}