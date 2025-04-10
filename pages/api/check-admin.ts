import type { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth, firestore } from '@/lib/firebase-admin';

type CheckAdminResponse = {
  success: boolean;
  message: string;
  user?: any;
  isAdmin?: boolean;
  actions?: any[];
  error?: string;
}

/**
 * Endpoint to check and fix admin status
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckAdminResponse>
) {
  // Allow either GET or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    const email = req.query.email as string || req.body?.email;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email parameter required",
        error: "Missing email parameter"
      });
    }
    
    console.log(`Checking admin status for email: ${email}`);
    
    // Look up user by email
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      const actions = [];
      
      // Check if user exists in admins collection
      const adminDoc = await firestore.collection('admins').doc(userRecord.uid).get();
      const isAdmin = adminDoc.exists;
      
      let message = isAdmin 
        ? `User ${email} is already an admin`
        : `User ${email} is not an admin`;
      
      // If POST and not admin, create the admin document
      if (req.method === 'POST' && !isAdmin) {
        await firestore.collection('admins').doc(userRecord.uid).set({
          email: userRecord.email,
          createdAt: new Date(),
          displayName: userRecord.displayName || email.split('@')[0],
          autoCreated: true
        });
        
        message = `User ${email} has been set as an admin`;
        actions.push({
          action: "create_admin",
          success: true,
          uid: userRecord.uid
        });
      }
      
      return res.status(200).json({
        success: true,
        message,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        },
        isAdmin: isAdmin || (req.method === 'POST'),
        actions: actions.length > 0 ? actions : undefined
      });
    } catch (error) {
      console.error(`Error checking/creating admin:`, error);
      return res.status(404).json({
        success: false,
        message: `User with email ${email} not found`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error) {
    console.error('Check admin endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: "Error checking admin status",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}