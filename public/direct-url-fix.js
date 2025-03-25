/**
 * Simple URL Fix Script
 * This script intercepts hardcoded API URLs and redirects them to debug endpoints
 */
(function() {
  console.log('Simple URL Fix Script loaded');
  
  // Define URL mappings for various endpoints
  const URL_MAPPINGS = [
    // Signals API
    { 
      pattern: 'https://personalsite77.vercel.app/api/signals', 
      replacement: '/api/signals-debug'
    },
    { 
      pattern: '/api/signals', 
      replacement: '/api/signals-debug' 
    },
    
    // Books API
    { 
      pattern: 'https://personalsite77.vercel.app/api/books', 
      replacement: '/api/books-debug'
    },
    { 
      pattern: '/api/books', 
      replacement: '/api/books-debug'
    }
  ];
  
  // Patch the fetch function to intercept API calls
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string') {
      // Check each mapping pattern
      for (const mapping of URL_MAPPINGS) {
        if (url.includes(mapping.pattern)) {
          console.log('URL Fix: Intercepting fetch call to:', url);
          
          // Create the new URL by replacing the pattern
          const newUrl = url.replace(mapping.pattern, mapping.replacement);
          console.log('URL Fix: Redirecting to debug endpoint:', newUrl);
          
          return originalFetch(newUrl, options);
        }
      }
    }
    
    // Default case: use original fetch
    return originalFetch(url, options);
  };
  
  console.log('Simple URL Fix Script initialized');
})();