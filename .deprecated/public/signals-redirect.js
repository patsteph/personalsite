/**
 * This script is loaded in development mode to redirect signals API calls
 * to the signals-dev endpoint.
 */
(function() {
  console.log('Loading signals API redirect hook');
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch to intercept signals API calls
  window.fetch = function(url, options) {
    // Check if URL is a string and contains our signals API path
    if (typeof url === 'string' && 
        (url.includes('/api/signals') || 
         url.includes('personalsite77.vercel.app/api/signals'))) {
      
      // Log the interception
      console.log('Intercepting signals API call:', url);
      
      // Replace with dev endpoint
      let newUrl;
      if (url.includes('personalsite77.vercel.app')) {
        // Extract path from absolute URL and convert to dev endpoint
        const urlObj = new URL(url);
        newUrl = '/api/signals-dev' + urlObj.search;
      } else {
        // Just replace signals with signals-dev in relative URL
        newUrl = url.replace('/api/signals', '/api/signals-dev');
      }
      
      console.log('Redirecting to dev API:', newUrl);
      
      // Call the original fetch with our new URL
      return originalFetch(newUrl, options);
    }
    
    // For all other URLs, use the original fetch
    return originalFetch(url, options);
  };
  
  console.log('Signals API redirect hook installed');
})();