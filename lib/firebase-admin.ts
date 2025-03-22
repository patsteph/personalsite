// This module should only be imported in server-side code
// Never import this in client-side components or pages

// Make sure this code only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('firebase-admin should only be imported on the server side');
}

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
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
  }
}

export const firebaseAdmin = admin;
export const auth = admin.auth();
export const firestore = admin.firestore();