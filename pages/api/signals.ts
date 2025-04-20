import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeAdminApp, getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin'; 
import { Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { Auth } from 'firebase-admin/auth';

// Initialize Firebase Admin
let db: FirebaseFirestore.Firestore;
let auth: Auth;

try {
  console.log('Signals API: Attempting Firebase Admin SDK initialization at module level...');
  initializeAdminApp(); 
  db = getAdminFirestore();
  auth = getAdminAuth();
  console.log('Signals API: Firebase Admin SDK initialized successfully at module level.');
} catch (initError: any) {
  console.error('Signals API: CRITICAL ERROR DURING FIREBASE ADMIN SDK INITIALIZATION:', initError);
  console.error('Initialization Error Name:', initError.name);
  console.error('Initialization Error Message:', initError.message);
  console.error('Initialization Error Stack:', initError.stack);
  // Set db/auth to null/undefined or handle appropriately
  // @ts-ignore - Allow reassignment for error case
  db = null;
  // @ts-ignore - Allow reassignment for error case
  auth = null;
}

const SIGNALS_COLLECTION = 'signals';

type SignalResponse = {
  success: boolean;
  data?: any; // Can be single signal or array
  error?: string;
  // socialShareResults might be handled separately or removed if not used by API
  // socialShareResults?: Record<string, 'success' | 'error'>;
}

// Helper to convert Firestore doc data (with Timestamps) to API response format (with ISO strings)
function convertFirestoreToApiResponse(docData: FirebaseFirestore.DocumentData): any {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return data;
}

// Helper to sanitize incoming data (undefined -> null)
function sanitizeData(body: any): Record<string, any> {
    return Object.entries(body).reduce((acc, [key, value]) => {
        // Keep null values as null, convert undefined to null
        acc[key] = value === undefined ? null : value;
        return acc;
    }, {} as Record<string, any>);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignalResponse>
) {
  // Check if initialization failed earlier
  if (!db || !auth) {
    console.error('Signals API: Handler entered but Firebase Admin SDK failed to initialize. Returning 500.');
    // Avoid processing if initialization failed
    return res.status(500).json({ success: false, error: 'Internal Server Error: Firebase Admin SDK initialization failed.' });
  }

  console.log('Signals API received', req.method, 'request',
    req.query ? `with query: ${JSON.stringify(req.query)}` : '',
    req.body ? `with body: ${JSON.stringify(req.body)}` : ''
  );
  
  // --- CORS Headers --- (Keep existing headers)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust in production
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
      console.log('Signals API: Handling OPTIONS preflight request.');
      return res.status(200).end();
  }

  const signalsCollection = db.collection(SIGNALS_COLLECTION);

  try {
    // --- Handle GET Requests (Publicly Accessible) --- 
    if (req.method === 'GET') {
      try {
        console.log('Signals API: Processing GET request.');
        const { id, type } = req.query;

        if (id && typeof id === 'string') {
            // Fetch single signal by ID
            console.log(`Signals API: Fetching signal by ID: ${id}`);
            const docRef = signalsCollection.doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                console.log(`Signals API: Found signal ID: ${id}`);
                return res.status(200).json({
                    success: true,
                    data: { id: docSnap.id, ...convertFirestoreToApiResponse(docSnap.data()!) }
                });
            } else {
                console.log(`Signals API: Signal not found by ID: ${id}`);
                return res.status(404).json({ success: false, error: 'Signal not found' });
            }
        } else if (type && typeof type === 'string') {
            // Fetch signals by type
            console.log(`Signals API: Fetching signals by type: ${type}`);
            // Consider adding ordering, e.g., .orderBy('createdAt', 'desc')
            const querySnapshot = await signalsCollection.where('type', '==', type).get();
            const signals = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...convertFirestoreToApiResponse(doc.data())
            }));
            console.log(`Signals API: Found ${signals.length} signals of type: ${type}`);
            return res.status(200).json({ success: true, data: signals });
        } else {
            // Fetch all signals
            console.log('Signals API: Fetching all signals.');
            // Consider adding ordering
            const querySnapshot = await signalsCollection.get(); 
            const signals = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...convertFirestoreToApiResponse(doc.data())
            }));
            console.log(`Signals API: Found ${signals.length} total signals.`);
            return res.status(200).json({ success: true, data: signals });
        }
      } catch (error: any) {
        console.error('Signals API GET error:', error);
        return res.status(500).json({ success: false, error: `Internal server error getting signals: ${error.message}` });
      }
    }

    // --- Authentication Check for Mutating Methods (POST, PUT, DELETE) --- 
    if (['POST', 'PUT', 'DELETE'].includes(req.method!)) {
      try {
        console.log(`Signals API: Checking authentication for ${req.method}.`);
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            console.log('Signals API: No token provided for mutation.');
            return res.status(401).json({ success: false, error: 'No token provided' });
        }
        await auth.verifyIdToken(idToken);
        console.log(`Signals API: Token verified for ${req.method}.`);
      } catch (error: any) {
        console.error(`Signals API auth error for ${req.method}:`, error.code, error.message);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ success: false, error: 'Unauthorized - Token expired' });
        }
        return res.status(401).json({ success: false, error: 'Unauthorized - Invalid token' });
      }
    } 
    // --- End Authentication Check ---

    // --- Handle Authenticated POST --- 
    if (req.method === 'POST') {
      try {
        console.log('Signals API: Entered POST handler try block.');
        console.log('Signals API: Raw request body:', req.body);
        const sanitizedBody = sanitizeData(req.body);
        console.log('Signals API: Sanitized request body:', sanitizedBody);
        
        // Basic validation (add more as needed)
        if (!sanitizedBody.name || !sanitizedBody.type || !sanitizedBody.value) {
            return res.status(400).json({ success: false, error: 'Missing required fields (name, type, value)' });
        }

        console.log('Signals API: Preparing data for Firestore...');
        const now = Timestamp.now();
        // Explicitly type to include potential 'id' and other fields from body
        const signalData: { [key: string]: any } = {
            ...sanitizedBody,
            createdAt: now,
            updatedAt: now,
        };
        delete signalData.id; // Firestore generates ID
        console.log('Signals API: Firestore data prepared:', signalData);

        console.log('Signals API: Attempting to add document to Firestore...');
        const docRef = await signalsCollection.add(signalData);
        console.log(`Signals API: Document added successfully with ID: ${docRef.id}`);
        
        // Fetch and return the new document
        const newDoc = await docRef.get();
        if (!newDoc.exists) { 
            console.error('Signals API: Failed to retrieve newly created signal document:', docRef.id);
            return res.status(500).json({ success: false, error: 'Failed to retrieve signal after creation' });
        }

        return res.status(201).json({
            success: true,
            data: { id: newDoc.id, ...convertFirestoreToApiResponse(newDoc.data()!) }
        });
      } catch (error: any) {
        console.error('Signals API POST error:', error);
        console.error('Detailed error:', { 
            message: error.message,
            code: error.code,
            stack: error.stack,
        });
        return res.status(500).json({ success: false, error: `Internal server error creating signal: ${error.message}` });
      }
    }

    // --- Handle Authenticated PUT --- 
    if (req.method === 'PUT') {
      try {
        console.log('Signals API: Handling PUT request.');
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ success: false, error: 'Signal ID is required in query parameters' });
        }

        const docRef = signalsCollection.doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            console.log(`Signals API: PUT failed, document not found: ${id}`);
            return res.status(404).json({ success: false, error: 'Signal not found' });
        }

        const sanitizedBody = sanitizeData(req.body);
        const updateData: { [key: string]: any } = { 
            ...sanitizedBody,
            updatedAt: Timestamp.now()
        };
        delete updateData.id;
        delete updateData.createdAt;

        console.log(`Signals API: Updating document ${id} with data:`, updateData);
        await docRef.update(updateData);
        console.log(`Signals API: Document ${id} updated successfully.`);

        // Fetch and return the updated document
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists) { 
           console.error(`Signals API: Signal document ${id} not found after update.`);
           return res.status(404).json({ success: false, error: 'Signal not found after update' });
        }

        return res.status(200).json({
            success: true,
            data: { id: updatedDoc.id, ...convertFirestoreToApiResponse(updatedDoc.data()!) }
        });
      } catch (error: any) {
        console.error(`Signals API PUT error for ID ${req.query.id}:`, error);
        console.error('Detailed error:', { 
            message: error.message,
            code: error.code,
            stack: error.stack,
        });
        return res.status(500).json({ success: false, error: `Internal server error updating signal: ${error.message}` });
      }
    }

    // --- Handle Authenticated DELETE --- 
    if (req.method === 'DELETE') {
      try {
        console.log('Signals API: Handling DELETE request.');
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ success: false, error: 'Signal ID is required in query parameters' });
        }

        const docRef = signalsCollection.doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            console.log(`Signals API: DELETE skipped, document not found: ${id}`);
            return res.status(200).json({ success: true, data: { id, message: 'Already deleted or never existed' } });
        }

        console.log(`Signals API: Deleting document ${id}.`);
        await docRef.delete();
        console.log(`Signals API: Document ${id} deleted successfully.`);

        return res.status(200).json({ success: true, data: { id } });
      } catch (error: any) {
        console.error(`Signals API DELETE error for ID ${req.query.id}:`, error);
        console.error('Detailed error:', { 
            message: error.message,
            code: error.code,
            stack: error.stack,
        });
        return res.status(500).json({ success: false, error: `Internal server error deleting signal: ${error.message}` });
      }
    }

    // --- Method Not Allowed --- 
    // If we reach here, the method is not GET, POST, PUT, DELETE, or OPTIONS
    console.log(`Signals API: Method ${req.method} not allowed.`);
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    // --- Catch any errors that occurred anywhere in the handler --- 
    console.error('Signals API: UNCAUGHT ERROR IN HANDLER:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    if (error.cause) {
      console.error('Error Cause:', error.cause);
    }
    // Ensure a 500 response is sent, consistent with type
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: 'Internal Server Error occurred in handler.' });
    } else {
      // If headers already sent, we can't send another response, but log it.
      console.error('Signals API: Headers already sent, could not send 500 response for uncaught error.');
    }
  } // --- End Top-Level Try-Catch Block ---
}