import type { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth, firestore } from '@/lib/firebase-admin';

type DebugResponse = {
  success: boolean;
  message: string;
  collections?: any[];
  adminUsers?: any[];
  tokens?: any[];
  error?: string;
}

/**
 * Debug endpoint for authentication issues
 * This endpoint should be removed in production
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebugResponse>
) {
  try {
    // Check all admin-related collections
    const collections = ['admins', 'admin', 'admin_tokens'];
    const results = [];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await firestore.collection(collectionName).get();
        results.push({
          collection: collectionName,
          count: snapshot.size,
          exists: !snapshot.empty,
          documents: snapshot.docs.map(doc => ({
            id: doc.id,
            path: doc.ref.path,
            data: doc.data()
          }))
        });
      } catch (error) {
        results.push({
          collection: collectionName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // List all users
    let adminUsers: Array<{
      uid: string;
      email: string | undefined;
      emailVerified: boolean;
      displayName: string | undefined;
    }> = [];
    
    try {
      // Limit to 10 users for safety
      const listUsersResult = await adminAuth.listUsers(10);
      adminUsers = listUsersResult.users.map(user => ({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName
      }));
    } catch (error) {
      console.error("Error listing users:", error);
    }
    
    // Try to fix any missing admin documents
    if (adminUsers.length > 0 && results[0].count === 0) {
      // No admins in collection, create one for the first user
      const firstUser = adminUsers[0];
      await firestore.collection('admins').doc(firstUser.uid).set({
        email: firstUser.email,
        createdAt: new Date(),
        autoCreated: true
      });
      
      results.push({
        action: "created_admin_document",
        user: firstUser.email,
        uid: firstUser.uid
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Authentication debug information",
      collections: results,
      adminUsers
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving debug information",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}