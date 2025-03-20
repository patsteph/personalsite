import { useEffect, useState } from 'react';

export default function AdminButton() {
  // State to hold URL, initialized empty for SSR
  const [adminUrl, setAdminUrl] = useState('/admin-login.html');

  // Only use window in useEffect (client-side only)
  useEffect(() => {
    // Now safe to use window
    if (typeof window !== 'undefined') {
      // No longer using GitHub Pages, use relative path
      setAdminUrl('/admin-login.html');
    }
  }, []);
  
  return (
    <a 
      href={adminUrl}
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue inline-block"
    >
      Admin
    </a>
  );
}