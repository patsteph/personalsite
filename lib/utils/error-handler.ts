/**
 * Centralized error handling utilities for the application
 */

import { toast, ToastOptions } from 'react-toastify';

// Debug mode flag - could be set based on environment
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Error types
export type AppError = {
  message: string;
  code?: string;
  originalError?: unknown;
};

/**
 * Log errors consistently with optional debug information in development
 */
export function logError(error: unknown, context = ''): AppError {
  // Format the error into a standard AppError
  const appError = formatError(error);
  
  // Always log in development, selectively in production
  if (DEBUG_MODE) {
    console.error(
      `🔴 Error${context ? ` in ${context}` : ''}:`,
      appError.message,
      appError.code ? `(Code: ${appError.code})` : '',
      appError.originalError || ''
    );
  } else {
    // In production, only log the formatted error without original error details
    console.error(
      `Error${context ? ` in ${context}` : ''}:`,
      appError.message,
      appError.code ? `(Code: ${appError.code})` : ''
    );
  }
  
  return appError;
}

/**
 * Display user-friendly error notifications using react-toastify
 * @returns The formatted error object for further processing if needed
 */
export function notifyError(error: unknown, context = ''): AppError {
  const appError = formatError(error);
  
  // Log the error
  logError(error, context);
  
  // Default toast options
  const toastOptions: ToastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };
  
  // Show a user-friendly toast notification
  toast.error(appError.message, toastOptions);
  
  // Return the formatted error in case the caller wants to use it
  return appError;
}

/**
 * Format any type of error into a consistent AppError object
 */
export function formatError(error: unknown): AppError {
  // Already formatted
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      message: String(error.message),
      code: 'code' in error ? String(error.code) : undefined,
      originalError: error,
    };
  }
  
  // Firebase errors
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return {
      message: formatFirebaseErrorMessage(String(error.code), String(error.message)),
      code: String(error.code),
      originalError: error,
    };
  }
  
  // String errors
  if (typeof error === 'string') {
    return {
      message: error,
      originalError: new Error(error),
    };
  }
  
  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred',
    originalError: error,
  };
}

/**
 * Format Firebase error messages to be more user-friendly
 */
function formatFirebaseErrorMessage(code: string, message: string): string {
  // Map of common Firebase error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Please use a stronger password',
    'auth/invalid-email': 'Invalid email address',
    'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
    'permission-denied': 'You don\'t have permission to perform this action',
    // Add more mappings as needed
  };
  
  // Return mapped message or the original if no mapping exists
  return errorMap[code] || 
    // Make the Firebase message more user-friendly by removing technical prefixes
    message.replace('Firebase:', '').replace(/\([^)]*\)/g, '').trim() || 
    'An error occurred';
}

/**
 * Handle API request errors consistently
 */
export async function handleApiError<T>(
  promise: Promise<T>,
  context = ''
): Promise<[T | null, AppError | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const formattedError = logError(error, context);
    return [null, formattedError];
  }
}

/**
 * Hook for components to use try/catch with async functions
 */
export function useTryCatch() {
  return async <T>(
    fn: () => Promise<T>,
    options: {
      context?: string;
      onError?: (error: AppError) => void;
      showNotification?: boolean;
    } = {}
  ): Promise<[T | null, AppError | null]> => {
    const { context = '', onError, showNotification = true } = options;
    
    try {
      const result = await fn();
      return [result, null];
    } catch (error) {
      const appError = formatError(error);
      
      // Log the error
      logError(appError, context);
      
      // Show notification if enabled
      if (showNotification) {
        notifyError(appError);
      }
      
      // Call custom error handler if provided
      if (onError) {
        onError(appError);
      }
      
      return [null, appError];
    }
  };
}
