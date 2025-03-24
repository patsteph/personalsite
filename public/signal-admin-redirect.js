/**
 * This script automatically redirects from the original signals admin page
 * to the fixed version that uses the signals-proxy API.
 */
(function() {
  console.log('[Signal Redirect] Script loaded');
  
  // Check if we're on the original signals admin page
  if (window.location.pathname === '/admin/signals') {
    // Only redirect if we're not already in the process of redirecting
    if (!window.location.href.includes('redirected=true')) {
      console.log('[Signal Redirect] Detected signals admin page, redirecting to fixed version');
      
      // Redirect to the fixed version with a parameter to prevent redirect loops
      window.location.href = '/admin/signals-fixed?redirected=true';
    }
  }
  
  // For users manually typing in URLs, also redirect if it's in the URL hash
  if (window.location.hash === '#/admin/signals') {
    console.log('[Signal Redirect] Detected hash-based URL, redirecting to fixed version');
    window.location.href = '/admin/signals-fixed?redirected=true';
  }
  
  // Create a MutationObserver to watch for navigation changes
  const observer = new MutationObserver(function(mutations) {
    // Check if an admin link to the signals page has been added
    const signalsLinks = document.querySelectorAll('a[href="/admin/signals"]');
    
    if (signalsLinks.length > 0) {
      console.log('[Signal Redirect] Found signals admin links, updating to fixed version');
      
      // Update all links to the signals page
      signalsLinks.forEach(link => {
        link.setAttribute('href', '/admin/signals-fixed');
        link.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.href = '/admin/signals-fixed';
        });
      });
    }
  });
  
  // Start observing when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[Signal Redirect] Observer started');
  });
  
  console.log('[Signal Redirect] Script initialized');
})();