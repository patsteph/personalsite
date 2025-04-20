import { initializeApp, getApps, getApp, ServiceAccount, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Ensure environment variables are loaded (typically handled by Next.js)
// You need to set these in your .env.local file
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Replace literal \n with actual newlines for environment variable compatibility
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
};

const ADMIN_APP_NAME = 'firebase-admin-app';

function initializeAdminApp() {
  // Check if already initialized
  if (getApps().some(app => app.name === ADMIN_APP_NAME)) {
    console.log(`Firebase Admin App (${ADMIN_APP_NAME}) already initialized.`);
    return; // Exit if already initialized
  }

  console.log(`Attempting to initialize Firebase Admin App (${ADMIN_APP_NAME})...`);
  // Log credentials being used (excluding private key for security)
  console.log(`Using Service Account - ProjectID: ${serviceAccount.projectId}, ClientEmail: ${serviceAccount.clientEmail}`);

  try {
    initializeApp({
      credential: cert(serviceAccount as ServiceAccount), 
      // Optional: databaseURL if using Realtime Database
      // databaseURL: process.env.FIREBASE_DATABASE_URL,
    }, ADMIN_APP_NAME);
    console.log(`Firebase Admin App (${ADMIN_APP_NAME}) initialized successfully.`);
  } catch (error: any) {
    console.error('Firebase Admin SDK initializeApp encountered an error:', error);
    console.error('Error Stack:', error.stack); 
    console.error('Service Account used (excluding private key):', { 
      projectId: serviceAccount.projectId, 
      clientEmail: serviceAccount.clientEmail 
    });
    // Decide how to handle initialization errors. Throwing might stop the server.
    // throw new Error('Failed to initialize Firebase Admin SDK'); 
  }
}

function getAdminFirestore() {
  // Ensure app is initialized before getting Firestore
  initializeAdminApp(); 
  console.log(`Attempting to get Firestore instance for app (${ADMIN_APP_NAME})...`);
  try {
    const adminApp = getApp(ADMIN_APP_NAME);
    const firestoreInstance = getFirestore(adminApp);
    console.log(`Successfully got Firestore instance for app (${ADMIN_APP_NAME}).`);
    return firestoreInstance;
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    // Re-throw or handle error appropriately
    throw new Error('Could not get Firestore instance. Admin app might not be initialized correctly.');
  }
}

function getAdminAuth() {
  // Ensure app is initialized before getting Auth
  initializeAdminApp();
  console.log(`Attempting to get Auth instance for app (${ADMIN_APP_NAME})...`);
  try {
    const adminApp = getApp(ADMIN_APP_NAME);
    const authInstance = getAuth(adminApp);
    console.log(`Successfully got Auth instance for app (${ADMIN_APP_NAME}).`);
    return authInstance;
  } catch (error) {
    console.error('Error getting Auth instance:', error);
    // Re-throw or handle error appropriately
    throw new Error('Could not get Auth instance. Admin app might not be initialized correctly.');
  }
}

// Export the functions needed by API routes
export { initializeAdminApp, getAdminFirestore, getAdminAuth };
