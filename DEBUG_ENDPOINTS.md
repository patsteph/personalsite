# Debug Endpoints - TO BE REMOVED IN PRODUCTION

This file lists all the temporary debug endpoints and modifications added to troubleshoot the admin login issue.

## Debug Endpoints

1. `/api/debug-auth` - Lists all admin-related collections and users
   - File: `/pages/api/debug-auth.ts`

2. `/api/check-admin?email=your@email.com` - Checks if a user is an admin
   - File: `/pages/api/check-admin.ts`
   - Also supports POST requests to make a user an admin

## Temporary Code Modifications

1. Auto-create admin document during login
   - File: `/pages/api/auth.ts`
   - Lines ~96-128
   - Automatically creates an admin document for users attempting to log in

## How to Use

1. To view debug information:
   - Visit `/api/debug-auth` in your browser
   
2. To check if an email is registered as admin:
   - Visit `/api/check-admin?email=your@email.com` in your browser
   
3. To make an email admin:
   - Send a POST request to `/api/check-admin` with the email parameter:
     ```
     curl -X POST "https://your-site.com/api/check-admin?email=your@email.com"
     ```
   
## Cleanup Process

Once the admin login is working properly:

1. Remove the debug endpoints:
   - Delete `/pages/api/debug-auth.ts`
   - Delete `/pages/api/check-admin.ts`

2. Remove the auto-create admin code from `/pages/api/auth.ts`:
   ```javascript
   // TEMPORARY: Force admin access for first login - remove in production!
   if (!isAdmin) {
     console.log(`User ${email} not found in admins collection - attempting to create admin document`);
     
     try {
       // Create admin document for this user
       await firestore.collection('admins').doc(userRecord.uid).set({
         email: userRecord.email,
         createdAt: new Date(),
         displayName: userRecord.displayName || '',
         autoCreated: true
       });
       console.log(`Successfully created admin document for ${email}`);
       
       // Set isAdmin to true since we just created the admin document
       isAdmin = true;
     } catch (createError) {
       console.error(`Failed to create admin document:`, createError);
       
       // Return error for normal flow
       return res.status(403).json({ 
         success: false, 
         error: 'Not authorized as admin',
         debug: { 
           uid: userRecord.uid, 
           email: userRecord.email,
           adminCollection: 'admins',
           adminDocPath: adminDoc.ref.path,
           createError: createError instanceof Error ? createError.message : String(createError)
         }
       });
     }
   }
   ```

3. Delete this DEBUG_ENDPOINTS.md file