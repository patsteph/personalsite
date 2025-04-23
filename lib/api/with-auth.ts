import { GetServerSideProps, GetServerSidePropsContext, Redirect } from 'next';
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '@/lib/firebase-admin';
import { parseCookies } from 'nookies';
import { AUTH_COOKIE_NAME } from '@/lib/utils/cookies';

/**
 * Server-side authentication middleware for pages
 * Wraps a getServerSideProps function to ensure the user is authenticated
 * For admin-only pages
 */
export const withAuth = <T extends Record<string, any>>(
  gssp: (context: GetServerSidePropsContext) => Promise<{ props: T } | { redirect: Redirect } | { notFound: true }>
): GetServerSideProps<T> => {
  return async (context) => {
    const { req, res } = context;
    const cookies = parseCookies({ req });
    const sessionCookie = cookies[AUTH_COOKIE_NAME];

    if (!sessionCookie) {
      return {
        redirect: {
          destination: '/admin/login',
          permanent: false,
        },
      };
    }

    try {
      // Verify session
      const auth = getAdminAuth();
      await auth.verifySessionCookie(sessionCookie);
      
      // User is authenticated, proceed with the page
      return await gssp(context);
    } catch (error) {
      // Session invalid/expired
      return {
        redirect: {
          destination: '/admin/login',
          permanent: false,
        },
      };
    }
  };
};

/**
 * API route authentication middleware
 * Wraps an API handler to ensure requests are authenticated
 * For admin-only API endpoints
 */
export function withApiAuth<T>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse<T>): Promise<void> => {
    try {
      // Get the session cookie
      const sessionCookie = req.cookies[AUTH_COOKIE_NAME];

      if (!sessionCookie) {
        return res.status(401).json({ error: 'Unauthorized' } as any);
      }

      // Verify the session cookie
      const auth = getAdminAuth();
      await auth.verifySessionCookie(sessionCookie);

      // Call the original handler
      return handler(req, res);
    } catch (error) {
      console.error('API Auth Error:', error);
      return res.status(401).json({ error: 'Unauthorized' } as any);
    }
  };
}

/**
 * API authentication middleware
 * Verifies the session cookie and returns the UID if valid
 */
export const validateAuthCookie = async (sessionCookie: string): Promise<string | null> => {
  if (!sessionCookie) {
    return null;
  }

  try {
    const auth = getAdminAuth();
    const decodedClaim = await auth.verifySessionCookie(sessionCookie);
    return decodedClaim.uid;
  } catch (error) {
    console.error('Error validating auth cookie:', error);
    return null;
  }
};
