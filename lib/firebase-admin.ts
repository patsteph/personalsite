// This module should only be imported in server-side code
// Never import this in client-side components or pages

// Make sure this code only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('firebase-admin should only be imported on the server side');
}

import * as admin from 'firebase-admin';
import { Signal, Newsletter, Article, SignalBase } from '@/types'; // Import all needed types

// Initialize Firebase Admin SDK
let adminInstance: admin.app.App | null = null;

function initializeAdminApp() {
  if (!admin.apps.length) {
    console.log('Admin app not initialized, attempting initialization...');
    try {
      // Validate required environment variables
      if (!process.env.FIREBASE_PROJECT_ID) {
        throw new Error("Missing FIREBASE_PROJECT_ID environment variable");
      }
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error("Missing FIREBASE_PRIVATE_KEY environment variable");
      }
      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error("Missing FIREBASE_CLIENT_EMAIL environment variable");
      }

      console.log("Initializing Firebase Admin with project ID:", process.env.FIREBASE_PROJECT_ID);

      adminInstance = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });

      console.log("Firebase Admin initialized successfully");
    } catch (error) {
      console.error("Firebase admin initialization error", error);
      // Re-throw the error to prevent using uninitialized instances
      throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // If already initialized by someone else, get the default app
    adminInstance = admin.apps[0];
    console.log('Firebase Admin already initialized, using existing app.');
  }
  return adminInstance;
}

// Export functions to get initialized instances
export function getFirebaseAdmin() {
  if (!adminInstance) {
    initializeAdminApp();
  }
  if (!adminInstance) {
     throw new Error("Failed to get initialized Firebase Admin instance.");
  }
  return adminInstance;
}

export function getFirebaseAuth() {
  const app = getFirebaseAdmin();
  return app.auth();
}

export function getAdminFirestore() {
  const app = getFirebaseAdmin();
  return app.firestore();
}

export async function getSignalsServerSide(): Promise<Signal[]> {
  console.log('getSignalsServerSide: Attempting to fetch signals server-side...');
  try {
    const firestore = getAdminFirestore();
    console.log('getSignalsServerSide: Firestore instance obtained.');
    const signalsCollection = firestore.collection('signals');
    // Order by creation date descending, limit if necessary
    const snapshot = await signalsCollection.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      console.log('getSignalsServerSide: No signals found.');
      return [];
    }

    const signals: Signal[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const id = doc.id;
      const type = data.type as 'newsletter' | 'article' | undefined;

      // Convert Firestore Timestamps to serializable format (ISO string)
      // Use appropriate date field or fallback to now
      const dateAdded = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      const publishDate = data.publishDate?.toDate ? data.publishDate.toDate().toISOString() : dateAdded; // For articles

      const baseData: Omit<SignalBase, 'id' | 'type'> = {
        title: data.title || '',
        description: data.content || '', // Map content to description
        url: data.sourceUrl || '', // Map sourceUrl to url
        imageUrl: data.imageUrl || undefined, // Use undefined if not present
        dateAdded: dateAdded,
        featured: typeof data.published === 'boolean' ? data.published : false, // Map published to featured, default false
        tags: data.tags || [],
      };

      if (type === 'newsletter') {
        const newsletter: Newsletter = {
          ...baseData,
          id: id,
          type: 'newsletter',
          frequency: data.frequency || 'monthly', // Default frequency
          publisher: data.source || '', // Map source to publisher
          subscriptionUrl: data.subscriptionUrl || baseData.url, // Use specific field or fallback to base url
          // sampleUrl: data.sampleUrl,
          // affiliateCode: data.affiliateCode,
        };
        return newsletter;
      } else if (type === 'article') {
        const article: Article = {
          ...baseData,
          id: id,
          type: 'article',
          author: data.author || '', // Requires author field
          source: data.source || '', // Use source field
          publishDate: publishDate,
          // readingTime: data.readingTime,
          // affiliateCode: data.affiliateCode,
        };
        return article;
      } else {
        // Handle documents without a valid type or default to one if appropriate
        // For now, we'll filter them out, but you might want a default
        console.warn(`Document ${id} has invalid or missing type: ${type}. Skipping.`);
        return null; // Mark for filtering
      }
    }).filter((signal): signal is Signal => signal !== null); // Filter out nulls and assert type

    console.log(`getSignalsServerSide: Successfully fetched and mapped ${signals.length} valid signals.`);
    return signals;
  } catch (error) {
    console.error('getSignalsServerSide: Error fetching signals:', error);
    // Return empty array on error to allow the page to build
    return [];
  }
}

// Optional: Keep original exports for backward compatibility if needed elsewhere, 
// but encourage use of the functions.
export const firebaseAdmin = admin; 
export const auth = getFirebaseAuth();
export const firestore = getAdminFirestore();