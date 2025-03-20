   // pages/404.tsx
   import { useEffect } from 'react';
   import { useRouter } from 'next/router';
   import { basePath } from '@/lib/config';
   
   export default function Custom404() {
     const router = useRouter();
     
     useEffect(() => {
       // Only run on client side
       if (typeof window !== 'undefined') {
         // Attempt to parse the path and route accordingly
         const path = window.location.pathname.replace(basePath, '');
         if (path.startsWith('/admin')) {
           // Check auth status before redirecting to admin pages
           // You may need additional logic here
         }
       }
     }, [router]);
     
     return <div>Loading...</div>;
}
