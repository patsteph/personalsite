/**
 * This script patches the compiled signals JavaScript file 
 * to intercept requests to the production API.
 */
(function() {
  console.log('[Signals JS Fix] Loading patch for bundled signals JavaScript');

  // Set a global flag to indicate we've loaded
  window.__SIGNALS_JS_FIX_LOADED = true;
  
  // Store the original fetch
  const originalFetch = window.fetch;
  
  // Function to intercept fetch calls and modify them
  window.fetch = function(url, options) {
    // Check if we're making a request to the signals API
    if (url && typeof url === 'string' && url.includes('/api/signals')) {
      console.log('[Signals JS Fix] Intercepting API call:', url);
      
      // Replace production URL with signals-proxy endpoint
      if (url.includes('personalsite77.vercel.app')) {
        const urlObj = new URL(url);
        url = '/api/signals-proxy' + urlObj.search;
      } else {
        url = url.replace('/api/signals', '/api/signals-proxy');
      }
      
      console.log('[Signals JS Fix] Redirecting to proxy API:', url);
    }
    
    // Make the modified request
    return originalFetch(url, options);
  };
  
  // Create a hook to intercept new script loads
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    // If a new script tag is created, check if it's a signals script
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && typeof value === 'string' && value.includes('signals-')) {
          console.log('[Signals JS Fix] Detected signals script loading:', value);
          
          // Add a hook to patch the script after it loads
          element.addEventListener('load', function() {
            console.log('[Signals JS Fix] Signals script loaded, attempting to patch');
            try {
              // Try to patch window.signals if it exists
              if (window.signals) {
                const originalSubmit = window.signals.submitSignal;
                window.signals.submitSignal = function(data) {
                  console.log('[Signals JS Fix] Intercepted signal submission');
                  data.url = '/api/signals-proxy';
                  return originalSubmit(data);
                };
                console.log('[Signals JS Fix] Successfully patched signals module');
              }
            } catch (e) {
              console.error('[Signals JS Fix] Error patching signals module:', e);
            }
          });
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    return element;
  };
  
  console.log('[Signals JS Fix] Patch installed');
})();