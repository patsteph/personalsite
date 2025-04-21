import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeAdminApp, getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin'; 
import { Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { Auth } from 'firebase-admin/auth';
import { SignalSchema, SignalSchemaType, convertFirestoreSignalToApiResponse, sanitizeData } from '@/lib/api/signals'; 
 
console.log('--- pages/api/signals.ts: Module evaluation starting ---');

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

export default async function handler(
  req: NextApiRequest,
  // Use `any` for data type temporarily to align with convertFirestoreSignalToApiResponse return type
  res: NextApiResponse<{ success: boolean; data?: any; error?: string; }>
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
                    data: { id: docSnap.id, ...convertFirestoreSignalToApiResponse(docSnap.data()!) } 
                }); // Use imported helper
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
                ...convertFirestoreSignalToApiResponse(doc.data()) // Use imported helper
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
                ...convertFirestoreSignalToApiResponse(doc.data()) // Use imported helper
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
        
        // --- Data Validation using Imported Zod Schema ---
        let validatedData: SignalSchemaType;
        try {
          console.log('Signals API: Attempting data validation with Zod...');
          // Use the imported SignalSchema
          validatedData = SignalSchema.parse(sanitizedBody);
          console.log('Signals API: Zod validation successful.');
        } catch (error: any) {
          console.error('Signals API: Zod validation failed:', error.errors || error);
          // Provide more specific error details if available from Zod
          const zodError = error.errors ? error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') : error.message;
          return res.status(400).json({ success: false, error: `Validation failed: ${zodError}` });
        }
        // --- End Zod Validation ---
 
        console.log('Signals API: Preparing data for Firestore...');
        const now = Timestamp.now();
        // Define type based on validated data before converting dateAdded
        const { dateAdded: validatedDateAddedString, ...restOfValidatedData } = validatedData;
        const signalData: Omit<SignalSchemaType, 'id' | 'dateAdded'> & { 
          createdAt: Timestamp; 
          updatedAt: Timestamp; 
        } = {
            ...restOfValidatedData,
            createdAt: now,
            updatedAt: now,
        };
        // Conditionally add the converted dateAdded Timestamp
        if (validatedDateAddedString) {
            try {
                (signalData as any).dateAdded = Timestamp.fromDate(new Date(validatedDateAddedString));
            } catch (dateError) {
                console.warn(`Signals API: Invalid dateAdded format received: ${validatedDateAddedString}. Skipping field.`);
            }
        }
        // Remove id if present, Firestore generates it
        delete (signalData as any).id; 
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
            // Use the imported conversion helper
            data: { id: newDoc.id, ...convertFirestoreSignalToApiResponse(newDoc.data()!) } 
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
      console.warn('Signals API: PUT method handler not fully implemented with Zod validation yet.');
      return res.status(501).json({ success: false, error: 'PUT method not implemented yet.' });
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