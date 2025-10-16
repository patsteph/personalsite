/**
 * Firebase Utility Functions
 * Shared helpers that work with both client and server Firebase instances
 */

/**
 * Determines if code is running on the server (Node.js) vs client (browser)
 * Useful for Firebase environment detection
 */
export const isServer = (): boolean => {
  return typeof window === "undefined";
};

/**
 * Determines if code is running in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

/**
 * Safely handles Firestore timestamp conversion
 * Works with both admin and client Firestore Timestamp objects
 */
export const timestampToDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;

  // Handle Firestore Timestamp objects (both admin and client)
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }

  // Handle date strings
  if (typeof timestamp === "string") {
    return new Date(timestamp);
  }

  // Handle Date objects
  if (timestamp instanceof Date) {
    return timestamp;
  }

  return null;
};

/**
 * Safely converts a date to ISO string for API responses
 */
export const dateToISOString = (date: Date | any | null): string | null => {
  const converted = timestampToDate(date);
  return converted ? converted.toISOString() : null;
};

/**
 * Environment-aware console logging
 * Only logs in development or when explicitly enabled
 */
export const firebaseLog = (message: string, ...args: any[]): void => {
  if (isDevelopment() || process.env.FIREBASE_DEBUG === "true") {
    console.log(`[Firebase] ${message}`, ...args);
  }
};
