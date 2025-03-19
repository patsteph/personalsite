import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/firebase-admin';
import * as authApi from '@/lib/api/auth';

type AuthResponse = {
  success: boolean;
  token?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  // Only allow POST method for authentication
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Use Firebase client SDK to sign in (we already have this function)
    const userCredential = await authApi.signInWithEmailAndPassword(email, password);
    
    // Get ID token for session
    const token = await userCredential.user.getIdToken();

    // Set session cookie if needed
    // For a more complete implementation, you could set a session cookie here
    // using Firebase Admin SDK, but for now we'll just return the token
    
    return res.status(200).json({ 
      success: true, 
      token: token
    });
  } catch (error: any) {
    console.error('API auth error:', error);
    return res.status(401).json({ 
      success: false, 
      error: error.message || 'Authentication failed' 
    });
  }
}