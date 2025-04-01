// This module should only be imported in server-side code
// Never import this in client-side components or pages

// Make sure this code only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('firebase-admin should only be imported on the server side');
}

import * as admin from 'firebase-admin';
import { Signal, Newsletter, Article, SignalBase } from '@/types'; // Import all needed types
import { BlogPost } from '@/types/blog'; // Import BlogPost type

// Initialize Firebase Admin SDK
let adminInstance: admin.app.App | null = null;
let firestoreAdmin: admin.firestore.Firestore;

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
  if (!firestoreAdmin) {
    firestoreAdmin = app.firestore();
  }
  return firestoreAdmin;
}

export async function getSignalsServerSide(): Promise<Signal[]> {
  console.log('firebase-admin: getSignalsServerSide called');
  let db: admin.firestore.Firestore;
  try {
    db = getAdminFirestore();
    console.log('firebase-admin (getSignals): Firestore admin obtained successfully.');
  } catch (initError) {
    console.error('firebase-admin (getSignals): FAILED to initialize Firestore Admin:', initError);
    throw new Error('Failed to initialize Firestore Admin for signals.');
  }
  
  console.log('getSignalsServerSide: Attempting to fetch signals server-side...');
  
  // Try different possible collection names
  const collectionNames = ['signals', 'signal', 'Signals'];
  let signals: Signal[] = [];
  
  for (const collectionName of collectionNames) {
    console.log(`firebase-admin: Trying to fetch from collection '${collectionName}'`);
    try {
      const signalsCollection = db.collection(collectionName);
      
      // Try different ordering fields (createdAt or dateAdded)
      const orderByFields = ['createdAt', 'dateAdded', 'updatedAt'];
      let snapshot = null;
      
      for (const orderByField of orderByFields) {
        try {
          console.log(`firebase-admin: Trying to order by '${orderByField}'`);
          snapshot = await signalsCollection.orderBy(orderByField, 'desc').get();
          if (!snapshot.empty) {
            console.log(`firebase-admin: Successfully ordered by '${orderByField}'`);
            break;
          }
        } catch (orderError) {
          console.log(`firebase-admin: Error ordering by '${orderByField}':`, orderError instanceof Error ? orderError.message : String(orderError));
          // Try the next ordering field
        }
      }
      
      // If all ordering attempts failed, try without ordering
      if (!snapshot) {
        console.log(`firebase-admin: Trying to fetch without ordering`);
        snapshot = await signalsCollection.get();
      }

      // Log snapshot details
      console.log(`firebase-admin (getSignals): Collection '${collectionName}' has ${snapshot.size} documents. Empty? ${snapshot.empty}`);
      
      if (!snapshot.empty) {
        // Log the first document's raw data to see its structure
        const firstDoc = snapshot.docs[0];
        console.log(`firebase-admin: First document from '${collectionName}':`, 
          JSON.stringify({
            id: firstDoc.id,
            data: firstDoc.data()
          }, null, 2));

        signals = snapshot.docs.map(doc => {
          const data = doc.data();
          const id = doc.id;
          const type = data.type as 'newsletter' | 'article' | undefined;

          // Convert Firestore Timestamps to serializable format (ISO string)
          // Use appropriate date field or fallback to null (not current date)
          const dateAdded = data.createdAt?.toDate ? 
                           data.createdAt.toDate().toISOString() : 
                           (data.dateAdded?.toDate ? 
                             data.dateAdded.toDate().toISOString() : 
                             (data.dateAdded && typeof data.dateAdded === 'string' ? 
                               data.dateAdded : null));
                             
          const publishDate = data.publishDate?.toDate ? 
                             data.publishDate.toDate().toISOString() : 
                             dateAdded; // For articles

          const baseData: Omit<SignalBase, 'id' | 'type'> = {
            title: data.title || '',
            description: data.content || data.description || '', // Try both content and description fields
            url: data.sourceUrl || data.url || '', // Try both sourceUrl and url fields
            imageUrl: data.imageUrl || data.image || null, // Try both imageUrl and image fields, use null instead of undefined
            dateAdded: dateAdded || new Date(data.createdAt || data.dateAdded || Date.now()).toISOString(), // Use dateAdded or fallback to a parsed date
            featured: typeof data.published === 'boolean' ? data.published : 
                     (typeof data.featured === 'boolean' ? data.featured : false), // Try both published and featured
            tags: data.tags || [],
          };

          if (type === 'newsletter') {
            const newsletter: Newsletter = {
              ...baseData,
              id: id,
              type: 'newsletter',
              frequency: data.frequency || 'monthly', // Default frequency
              publisher: data.source || data.publisher || '', // Try both source and publisher
              subscriptionUrl: data.subscriptionUrl || baseData.url, // Use specific field or fallback to base url
            };
            return newsletter;
          } else if (type === 'article') {
            const article: Article = {
              ...baseData,
              id: id,
              type: 'article',
              author: data.author || '', // Requires author field
              source: data.source || data.publication || '', // Try both source and publication
              publishDate: publishDate,
            };
            return article;
          } else {
            // If type is missing but we can determine it from other fields
            if (data.frequency || data.publisher || data.subscriptionUrl) {
              // Looks like a newsletter
              console.log(`Document ${id} missing type but has newsletter fields. Treating as newsletter.`);
              const newsletter: Newsletter = {
                ...baseData,
                id: id,
                type: 'newsletter',
                frequency: data.frequency || 'monthly',
                publisher: data.source || data.publisher || '',
                subscriptionUrl: data.subscriptionUrl || baseData.url,
              };
              return newsletter;
            } else if (data.author || data.publication) {
              // Looks like an article
              console.log(`Document ${id} missing type but has article fields. Treating as article.`);
              const article: Article = {
                ...baseData,
                id: id,
                type: 'article',
                author: data.author || '',
                source: data.source || data.publication || '',
                publishDate: publishDate,
              };
              return article;
            } else {
              // Can't determine type
              console.warn(`Document ${id} has invalid or missing type: ${type}. Skipping.`);
              return null; // Mark for filtering
            }
          }
        }).filter((signal): signal is Signal => signal !== null); // Filter out nulls and assert type

        console.log(`firebase-admin: Successfully fetched ${signals.length} signals from '${collectionName}'.`);
        console.log('firebase-admin (getSignals): Sample signal data:', JSON.stringify(signals.slice(0, 1), null, 2));
        
        // Break the loop as we found data
        break;
      }
    } catch (error) {
      console.error(`firebase-admin: Error fetching from collection '${collectionName}':`, error);
      // Continue to try the next collection
    }
  }
  
  if (signals.length === 0) {
    console.log('firebase-admin: No signals found in any collection.');
  } else {
    console.log(`firebase-admin: Returning ${signals.length} signals.`);
  }
  
  return signals;
}

/**
 * Fetches all blog posts directly using the Firebase Admin SDK.
 * Suitable for server-side rendering (getStaticProps, getServerSideProps).
 */
export async function getBlogPostsServerSide(): Promise<BlogPost[]> {
  console.log('firebase-admin: getBlogPostsServerSide called');
  let db: admin.firestore.Firestore;
  try {
    db = getAdminFirestore();
    console.log('firebase-admin (getBlogPosts): Firestore admin obtained successfully.');
  } catch (initError) {
    console.error('firebase-admin (getBlogPosts): FAILED to initialize Firestore Admin:', initError);
    throw new Error('Failed to initialize Firestore Admin for blog posts.');
  }
  
  // Try both collection names to see which one contains data
  const collectionNames = ['blog-posts', 'blogPosts', 'blogs', 'blog'];
  let posts: BlogPost[] = [];
  
  for (const collectionName of collectionNames) {
    console.log(`firebase-admin: Trying to fetch from collection '${collectionName}'`);
    try {
      const blogCollection = db.collection(collectionName);
      const snapshot = await blogCollection.orderBy('createdAt', 'desc').get();
      
      console.log(`firebase-admin: Collection '${collectionName}' has ${snapshot.size} documents. Empty? ${snapshot.empty}`);
      
      if (!snapshot.empty) {
        // Log the first document's raw data to see its structure
        const firstDoc = snapshot.docs[0];
        console.log(`firebase-admin: First document from '${collectionName}':`, 
          JSON.stringify({
            id: firstDoc.id,
            data: firstDoc.data()
          }, null, 2));
        
        posts = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamps to Date objects
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : createdAt;
          const publishedAt = data.publishedAt?.toDate ? data.publishedAt.toDate() : null; 

          // Check for published field - could be published or isPublished
          const isPublished = data.published !== undefined ? data.published : data.isPublished || false;
          
          // Map Firestore data to BlogPost type with serializable date values
          // Ensure all fields are JSON serializable (no undefined values)
          return {
            id: doc.id,
            title: data.title || 'Untitled Post', // Provide default title
            slug: data.slug || '', // Ensure slug is present, default to empty if not
            content: data.content || '', 
            summary: data.summary || data.excerpt || '', // Use summary or excerpt, default to empty
            tags: data.tags || [],
            published: isPublished, // Use the determined published value
            createdAt: createdAt.toISOString(), // Convert Date to ISO string for serialization
            updatedAt: updatedAt.toISOString(), // Convert Date to ISO string for serialization
            publishedAt: publishedAt ? publishedAt.toISOString() : null, // Convert Date to ISO string if not null
            // Optional fields from BlogPost type - provide defaults or handle undefined
            date: data.date || updatedAt.toISOString().split('T')[0], // Use specific date field or fallback
            author: data.author || 'Admin', // Default author
            coverImage: data.coverImage || null, // Convert undefined to null for serialization
            readingTime: data.readingTime || null, // Convert undefined to null for serialization
          } as BlogPost;
        });
        
        console.log(`firebase-admin: Successfully fetched ${posts.length} blog posts from '${collectionName}'.`);
        console.log('firebase-admin (getBlogPosts): Sample post data:', JSON.stringify(posts.slice(0, 1), null, 2));
        
        // Break the loop as we found data
        break;
      }
    } catch (error) {
      console.error(`firebase-admin: Error fetching from collection '${collectionName}':`, error);
      // Continue to try the next collection
    }
  }
  
  if (posts.length === 0) {
    console.log('firebase-admin: No blog posts found in any collection.');
  } else {
    console.log(`firebase-admin: Returning ${posts.length} blog posts.`);
  }
  
  return posts;
}

// Optional: Keep original exports for backward compatibility if needed elsewhere, 
// but encourage use of the functions.
export const firebaseAdmin = admin; 
export const auth = getFirebaseAuth();
export const firestore = getAdminFirestore();