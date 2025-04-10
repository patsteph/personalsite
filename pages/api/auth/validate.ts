import type { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth, firestore } from '@/lib/firebase-admin';

type ValidateResponse = {
  success: boolean;
  valid?: boolean;
  error?: string;
  debug?: any;
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
    
    console.log(`Attempting to validate token: ${token.substring(0, 10)}...`);
    
    // First, try to verify with Firebase
    try {
      await adminAuth.verifyIdToken(token);
      console.log('Token validated successfully via verifyIdToken');
      return res.status(200).json({ success: true, valid: true });
    } catch (verifyError) {
      console.log('Standard token validation failed, checking admin_tokens collection');
      
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
            console.log(`Token expiry check: ${expiryDate} vs ${now}, expired=${isExpired}`);
          }
          
          if (!isExpired) {
            // Validate against Firebase one more time using user ID
            try {
              await adminAuth.getUser(tokenData.userId);
              console.log('User ID from token validated successfully');
              return res.status(200).json({ success: true, valid: true });
            } catch (userError) {
              console.error('User validation error:', userError);
              return res.status(401).json({ 
                success: false, 
                valid: false, 
                error: 'Invalid user', 
                debug: { tokenFound: true, userError: true } 
              });
            }
          } else {
            console.log('Token is expired');
            
            // Delete expired token
            await tokenDoc.ref.delete();
            
            return res.status(401).json({ 
              success: false, 
              valid: false, 
              error: 'Token expired', 
              debug: { reason: 'expired' } 
            });
          }
        } else {
          console.log('Token not found in admin_tokens collection');
          return res.status(401).json({ 
            success: false, 
            valid: false, 
            error: 'Invalid token', 
            debug: { reason: 'not_found_in_collection' } 
          });
        }
      } catch (firestoreError) {
        console.error('Error checking token in Firestore:', firestoreError);
        return res.status(401).json({ 
          success: false, 
          valid: false, 
          error: 'Error validating token',
          debug: { firestoreError: true } 
        });
      }
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error validating token',
      debug: { unexpectedError: true } 
    });
  }
}