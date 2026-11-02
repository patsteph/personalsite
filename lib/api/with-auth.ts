import { GetServerSideProps, GetServerSidePropsContext, Redirect } from 'next';
import { NextApiRequest } from 'next';
import { verifyAdminSession } from '@/lib/api/server-auth';

/**
 * Server-side authentication middleware for pages.
 * Wraps a getServerSideProps function to ensure the caller is a verified
 * admin (same check API routes use - see lib/api/server-auth.ts) before
 * running the page's own data fetching.
 */
export const withAuth = <T extends Record<string, any>>(
  gssp: (context: GetServerSidePropsContext) => Promise<{ props: T } | { redirect: Redirect } | { notFound: true }>
): GetServerSideProps<T> => {
  return async (context) => {
    const isAdmin = await verifyAdminSession(context.req as unknown as NextApiRequest);

    if (!isAdmin) {
      return {
        redirect: {
          destination: '/admin/login',
          permanent: false,
        },
      };
    }

    return await gssp(context);
  };
};
