import Cookies from 'js-cookie';
import { serialize, SerializeOptions } from 'cookie';

// Cookie configuration constants
export const AUTH_COOKIE_NAME = 'auth_success';
export const FB_TOKEN_COOKIE_NAME = 'fb_token';
export const DEFAULT_EXPIRY_DAYS = 7;

// Debug mode flag
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Cookie utility for client-side operations
 */
export const clientCookies = {
  /**
   * Set a cookie on the client side
   * @param name Cookie name
   * @param value Cookie value
   * @param options Additional cookie options
   */
  set: (name: string, value: string, options?: Cookies.CookieAttributes): void => {
    try {
      const defaultOptions: Cookies.CookieAttributes = {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: DEFAULT_EXPIRY_DAYS
      };

      Cookies.set(name, value, { ...defaultOptions, ...options });
      if (IS_DEV) console.log(`Cookie '${name}' set successfully`);
    } catch (error) {
      console.error(`Error setting cookie '${name}':`, error);
    }
  },

  /**
   * Get a cookie value
   * @param name Cookie name
   * @returns Cookie value or undefined if not found
   */
  get: (name: string): string | undefined => {
    try {
      return Cookies.get(name);
    } catch (error) {
      console.error(`Error getting cookie '${name}':`, error);
      return undefined;
    }
  },

  /**
   * Remove a cookie
   * @param name Cookie name
   * @param options Additional cookie options
   */
  remove: (name: string, options?: Cookies.CookieAttributes): void => {
    try {
      const defaultOptions: Cookies.CookieAttributes = {
        path: '/'
      };
      
      Cookies.remove(name, { ...defaultOptions, ...options });
      if (IS_DEV) console.log(`Cookie '${name}' removed successfully`);
    } catch (error) {
      console.error(`Error removing cookie '${name}':`, error);
    }
  },

  /**
   * Check if a cookie exists
   * @param name Cookie name
   * @returns true if cookie exists, false otherwise
   */
  exists: (name: string): boolean => {
    return typeof Cookies.get(name) !== 'undefined';
  }
};

/**
 * Cookie utility for server-side operations in API routes
 */
export const serverCookies = {
  /**
   * Serialize a cookie for use in HTTP headers
   * @param name Cookie name
   * @param value Cookie value
   * @param options Additional options
   * @returns Serialized cookie string for Set-Cookie header
   */
  serialize: (name: string, value: string, options?: SerializeOptions): string => {
    const defaultOptions: SerializeOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * DEFAULT_EXPIRY_DAYS // 7 days in seconds
    };

    return serialize(name, value, { ...defaultOptions, ...options });
  },

  /**
   * Create a cookie clear instruction (for removing cookies server-side)
   * @param name Cookie name
   * @param options Additional options
   * @returns Serialized cookie string that will clear the cookie
   */
  clear: (name: string, options?: SerializeOptions): string => {
    const defaultOptions: SerializeOptions = {
      path: '/',
      httpOnly: true,
      maxAge: 0,
      expires: new Date(0)
    };

    return serialize(name, '', { ...defaultOptions, ...options });
  }
};

/**
 * Parse document.cookie for a specific cookie value
 * Use only when js-cookie is not available (e.g., during SSR)
 * @param name Cookie name
 * @returns Cookie value or undefined if not found
 */
export function parseCookieFromString(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  
  return undefined;
}

/**
 * Check if a cookie exists in document.cookie
 * Use only when js-cookie is not available
 * @param name Cookie name
 * @returns true if cookie exists, false otherwise
 */
export function hasCookieInString(name: string): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some(c => c.trim().startsWith(`${name}=`));
}

// Cookie-related helper functions for auth
export function setAuthCookie(value = 'true', options?: Cookies.CookieAttributes): void {
  clientCookies.set(AUTH_COOKIE_NAME, value, options);
}

export function removeAuthCookie(options?: Cookies.CookieAttributes): void {
  clientCookies.remove(AUTH_COOKIE_NAME, options);
}

export function hasAuthCookie(): boolean {
  return clientCookies.exists(AUTH_COOKIE_NAME);
}

// Firebase token cookie helpers
export function setFirebaseTokenCookie(token: string, options?: Cookies.CookieAttributes): void {
  clientCookies.set(FB_TOKEN_COOKIE_NAME, token, options);
}

export function getFirebaseTokenCookie(): string | undefined {
  return clientCookies.get(FB_TOKEN_COOKIE_NAME);
}

export function removeFirebaseTokenCookie(options?: Cookies.CookieAttributes): void {
  clientCookies.remove(FB_TOKEN_COOKIE_NAME, options);
}
