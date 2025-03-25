# Code Cleanup and Simplified Architecture

This document explains the simplified API architecture for the Personal Website project.

## API Architecture

### Core API Endpoints

The application has been simplified to use only these core API endpoints:

- `/api/signals.ts` - Main endpoint for signals management
- `/api/books.ts` - Main endpoint for books management  
- `/api/blog.ts` - Main endpoint for blog management
- `/api/auth.ts` - Main endpoint for authentication

### Removed Complexity

We've removed complexity by:

1. **No API Redirections**:
   - Removed all redirection and interception scripts
   - Simplified the fetch process to directly call the main endpoints

2. **Direct Firebase Connection**:
   - API endpoints connect directly to Firebase
   - Client code is configured to use these direct endpoints

3. **Authentication**:
   - All write operations require authentication
   - Authentication is handled at the API endpoint level

## Client Structure

### API Access

- Client code should access Firebase through the main API endpoints
- API client libraries are in `lib/api/` folder
- Example: `lib/api/signals.ts` for signals API functions

### Admin Components

- Admin components use the main API endpoints directly
- Example: `/pages/admin/signals.tsx` uses `/api/signals`

## Debugging

If you need to debug API issues:

1. Check server logs for API endpoint logs
2. Verify authentication tokens are being sent correctly
3. Verify the Firebase connection is working

## Adding New Features

When adding new features:

1. Determine if a new API endpoint is needed
2. Follow the pattern of existing API endpoints
3. Keep Firebase access in the API layer
4. Client code should not access Firebase directly except for authentication

## Legacy Debug Files

The following files have been disabled but kept for reference:

- `/public/fix-api-url.js`
- `/public/direct-url-fix.js`
- `/public/signals-js-fix.js`

## Legacy API Endpoints

The following API endpoints are deprecated but kept for backward compatibility:

- `/api/signals-debug.ts`
- `/api/signals-direct.ts`
- `/api/books-debug.ts`
- `/api/books-direct.ts`

These should not be used in new code.