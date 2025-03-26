import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Debug Firestore API called');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Check if Firestore is initialized
    const firestoreInitialized = !!firestore;
    console.log('Firestore initialized:', firestoreInitialized);
    
    // Try to access a simple collection
    let collectionAccessible = false;
    let collections: string[] = [];
    
    if (firestoreInitialized) {
      try {
        // Test listing collections
        const collectionsRef = await firestore.listCollections();
        collections = collectionsRef.map(col => col.id);
        collectionAccessible = true;
        console.log('Collections accessible, found:', collections);
      } catch (collectionError) {
        console.error('Error accessing collections:', collectionError);
      }
    }
    
    return res.status(200).json({
      success: true,
      initialized: firestoreInitialized,
      collectionAccessible,
      collections,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug-firestore API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}