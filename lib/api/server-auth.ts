/**
 * Server-side authentication utilities
 * This module should only be imported in API routes
 */
import { NextApiRequest } from 'next';
import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * Admin email allowlist, from the ADMIN_EMAILS env var (comma-separated).
 */
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Extract a bearer/ID token from a request.
 * Only real Firebase ID tokens are accepted: the Authorization header,
 * or the `fb_token` cookie set after a verified login. The client-side
 * `auth_success` cookie is a UI hint only (plain "true"), never a credential,
 * and is intentionally not read here.
 */
function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const fbToken = req.cookies['fb_token'];
  if (fbToken) return fbToken;

  return null;
}

/**
 * Validate a Firebase ID token from an API request and return the caller's UID.
 * Works with Firebase ID tokens, verified via the Admin SDK.
 */
export async function validateAuthToken(req: NextApiRequest): Promise<string | null> {
  // Local development convenience only: never true in a deployed environment
  // (Vercel always sets NODE_ENV=production for deployments).
  if (process.env.NODE_ENV === 'development') {
    return 'dev-admin-uid';
  }

  const token = extractToken(req);
  if (!token) {
    return null;
  }

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error validating auth token:', error);
    return null;
  }
}

/**
 * Verify that the request's caller is both authenticated AND an admin
 * (their verified email is in the ADMIN_EMAILS allowlist).
 * Use this for admin-only endpoints instead of validateAuthToken alone,
 * which only proves the caller is logged in.
 */
export async function verifyAdminSession(req: NextApiRequest): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const token = extractToken(req);
  if (!token) {
    return false;
  }

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const email = decodedToken.email?.toLowerCase();
    if (!email) {
      return false;
    }
    return getAdminEmails().includes(email);
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return false;
  }
}

// For backward compatibility
export const validateFirebaseIdToken = validateAuthToken;
