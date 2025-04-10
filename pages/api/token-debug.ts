import type { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth, firestore } from '@/lib/firebase-admin';

type DebugResponse = {
  success: boolean;
  message: string;
  tokenInfo?: any;
  error?: string;
}

/**
 * Temporary debug endpoint for token issues
 * TO BE REMOVED IN PRODUCTION
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebugResponse>
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: "No token provided",
        error: "Please provide a token in the Authorization header"
      });
    }
    
    // Try to decode without validation
    const tokenInfo: any = {
      tokenLength: token.length,
      firstChars: token.substring(0, 10) + '...',
      isCustomToken: token.includes(':'),
      inFirestore: false,
      validFirebase: false,
      expired: false
    };
    
    // Check if token is in admin_tokens collection
    try {
      const tokenSnapshot = await firestore
        .collection('admin_tokens')
        .where('token', '==', token)
        .limit(1)
        .get();
      
      if (!tokenSnapshot.empty) {
        const tokenDoc = tokenSnapshot.docs[0];
        const data = tokenDoc.data();
        
        tokenInfo.inFirestore = true;
        tokenInfo.firestoreData = {
          id: tokenDoc.id,
          userId: data.userId,
          email: data.email,
          created: data.created?.toDate ? data.created.toDate().toISOString() : null,
          expires: data.expires?.toDate ? data.expires.toDate().toISOString() : null
        };
        
        if (data.expires) {
          const expiryDate = data.expires.toDate ? data.expires.toDate() : new Date(data.expires);
          tokenInfo.expired = expiryDate < new Date();
        }
        
        // Check if user exists
        try {
          const userRecord = await adminAuth.getUser(data.userId);
          tokenInfo.userExists = true;
          tokenInfo.userEmail = userRecord.email;
        } catch (userError) {
          tokenInfo.userExists = false;
          tokenInfo.userError = userError instanceof Error ? userError.message : String(userError);
        }
      }
    } catch (firestoreError) {
      tokenInfo.firestoreError = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
    }
    
    // Try to validate with Firebase
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      tokenInfo.validFirebase = true;
      tokenInfo.decodedToken = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        exp: decodedToken.exp,
        iat: decodedToken.iat
      };
    } catch (verifyError) {
      tokenInfo.validFirebase = false;
      tokenInfo.verifyError = verifyError instanceof Error ? verifyError.message : String(verifyError);
    }
    
    // If this is a Firebase custom token, log it
    if (token.startsWith('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9')) {
      tokenInfo.tokenType = 'JWT format';
    } else if (token.includes(':')) {
      tokenInfo.tokenType = 'Firebase custom token';
      
      // For custom tokens, try to exchange it for an ID token
      tokenInfo.customTokenInfo = {
        note: "Custom tokens must be exchanged for ID tokens using the Firebase client SDK signInWithCustomToken() method"
      };
    }
    
    return res.status(200).json({
      success: true,
      message: "Token debug information",
      tokenInfo
    });
  } catch (error) {
    console.error('Token debug error:', error);
    return res.status(500).json({
      success: false,
      message: "Error debugging token",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}