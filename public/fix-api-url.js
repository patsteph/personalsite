// This script fixes hardcoded API URLs during development
// It runs before any API calls are made

(function() {
  console.log('Running fix-api-url.js hook');
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch to intercept any calls to the production API
  window.fetch = function(url, options) {
    // Check if URL is a string and contains our production domain
    if (typeof url === 'string' && url.includes('personalsite77.vercel.app')) {
      // Log the interception
      console.log('Intercepting API call to production URL:', url);
      
      // Extract the path from the URL
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Create a new relative URL using the current origin
      const newUrl = path;
      console.log('Redirecting to relative URL:', newUrl);
      
      // Call the original fetch with our new URL
      return originalFetch(newUrl, options);
    }
    
    // For all other URLs, use the original fetch
    return originalFetch(url, options);
  };
  
  // Also patch any script files that might have been loaded already
  if (typeof window.signals !== 'undefined' && typeof window.signals.submitFormData === 'function') {
    console.log('Patching signals module that was already loaded');
    const originalSubmitFormData = window.signals.submitFormData;
    
    window.signals.submitFormData = function(data, token) {
      // Force using relative URL
      data.apiUrl = '/api/signals';
      console.log('Forcing relative API URL in signals module');
      return originalSubmitFormData(data, token);
    };
  }
  
  // Attempt to fix bundled code by injecting our own module
  // This is a more aggressive approach that will ensure the fix works
  window.__fixApi = {
    getRelativeApiUrl: function(url) {
      if (typeof url === 'string' && url.includes('personalsite77.vercel.app')) {
        const urlObj = new URL(url);
        return urlObj.pathname;
      }
      return url;
    }
  };
  
  // Set a global variable that bundled code can check
  window.__FORCE_RELATIVE_APIS = true;
  
  console.log('API URL fix hook installed');
})();