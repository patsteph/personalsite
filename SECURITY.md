# Security status

**Last updated:** 2026-11-02, after a security review and fix pass (see PR history for details).

This file previously claimed a "Grade A (104/100)" audit result from January 2025. That assessment was inaccurate and has been removed — several of the protections it described (a working CSP, verified admin authentication) were not actually in effect. This file now tracks real, verifiable status instead of a self-reported score.

## Fixed in the 2026-11 security pass

- **Admin API authentication.** `lib/api/server-auth.ts` previously accepted an unsigned, client-settable cookie as a credential and never verified tokens in production. All admin-only routes (`/api/admin-analytics`, `/api/admin/cv`, `/api/admin/dashboard-stats`, `/api/ai/blog-assistant`) now verify a real Firebase ID token via the Admin SDK and check the caller's email against `ADMIN_EMAILS`.
- **Firestore rules** (`firestore-rules.txt`) now require a real admin check (`exists()` on an `/admins/{uid}` doc) for writes to content collections and for any access to `/admin_tokens`, instead of "any signed-in user."
- **Dead middleware removed.** `middleware-enhanced.ts`, which implemented CSP/rate-limiting/IP-blocking but was never actually loaded by Next.js (only `middleware.ts` is), has been deleted. A real `Content-Security-Policy` and other security headers are now set in `next.config.js`'s `headers()`, which does run on every response.
- **CORS.** Removed the `Access-Control-Allow-Origin: *` + `Access-Control-Allow-Credentials: true` combination (browsers reject it for credentialed requests, and it served no purpose for this same-origin app).
- **Dependency vulnerabilities.** `npm audit fix` brought the dependency tree from 68 known vulnerabilities (4 critical, 16 high) down to 0 critical / 7 high. The remaining 7 high-severity issues require major version bumps (Next.js 15→16, `firebase-admin`→14, `zod`→4) and are deferred to a separate change, since they need real regression testing.

## Known follow-up work (not yet done)

- The 7 remaining high-severity dependency issues above, via major version upgrades.
- The admin dashboard is spread across 9 separate pages under `pages/admin/` with inconsistent server-side protection (most rely only on the client-side `AuthProvider` redirect plus the now-fixed API-level checks). Consolidating these is tracked as general cleanup, not a security gap on its own now that the API layer is fixed.
- `next build` currently fails on `main` due to a pre-existing, unrelated TypeScript issue (`lib/api/storage.ts` importing `uuid` with no type declarations installed), and the Jest suite has at least one pre-existing missing dependency (`node-mocks-http`). Neither is new; both block a clean build/test run and should be fixed early in the next pass.

## How admin access works now

1. The browser holds a real Firebase ID token (via the Firebase Client SDK), sent as `Authorization: Bearer <token>` or the `fb_token` cookie.
2. Edge middleware (`middleware.ts`) does a fast, unauthenticated presence check on that cookie to redirect obviously-logged-out visitors — this is a UX optimization only, not the security boundary (Edge middleware can't run the Firebase Admin SDK to verify tokens).
3. Every admin API route and `getServerSideProps`-protected page verifies the token with the Firebase Admin SDK (`lib/api/server-auth.ts`'s `verifyAdminSession`, or `lib/api/with-auth.ts`) and checks the caller's email against `ADMIN_EMAILS`. This is the actual enforcement point.
