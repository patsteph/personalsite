# API Troubleshooting Guide

This guide helps diagnose issues with API endpoints in the personal website.

## Testing Approach

1. **Use the API Test Page**: Navigate to `/api-test` to test different HTTP methods against various endpoints.

2. **Browser Network Tab**: Use the browser's developer tools Network tab to:
   - Check request headers
   - Verify request payload
   - Examine response status and body
   - Check for CORS errors

3. **Server Logs**: Check the Vercel deployment logs to see any server-side errors.

## Common Issues

### 405 Method Not Allowed

This happens when:
- The API route doesn't handle the specified method
- Middleware is blocking or redirecting the request
- There's a CORS preflight issue (OPTIONS request failing)

### Authentication Failures

- Check that the bearer token is being sent correctly
- Verify token format and expiration
- Ensure Firebase admin is correctly initialized

### Request Format Issues

- Make sure Content-Type is set correctly ('application/json')
- Verify the request body is properly formatted JSON
- Check that all required fields are present

## How to Fix

1. **Middleware Issues**: Check the middleware.js file which might intercept routes.

2. **CORS Issues**: Ensure correct CORS headers are set on the API response:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   ```

3. **API Configuration**: Ensure proper Next.js API config:
   ```javascript
   export const config = {
     api: {
       bodyParser: true,
       externalResolver: false,
     },
   };
   ```

4. **Method Handling**: Make sure each method is explicitly handled:
   ```javascript
   if (req.method === 'POST') {
     // Handle POST
   } else if (req.method === 'GET') {
     // Handle GET
   } else if (req.method === 'OPTIONS') {
     // Handle OPTIONS
   } else {
     // Return 405 Method Not Allowed
   }
   ```

5. **Test with Curl**: Test API directly using curl to bypass browser issues:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"test":true}' https://yoursite.com/api/test-post
   ```

## Layer-by-Layer Approach

When troubleshooting, isolate each layer:

1. **Client Request**: Is the browser sending the correct request?
2. **Routing/Middleware**: Is the request being intercepted?
3. **API Handler**: Is the handler receiving the correct method?
4. **Auth Layer**: Is authentication working properly?
5. **Business Logic**: Is the core logic executing correctly?
6. **Database**: Is the database operation succeeding?
7. **Response**: Is the response properly formatted?

Use console logs at each layer to trace the request flow.
