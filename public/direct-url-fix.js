/**
 * This script directly patches hardcoded URLs in compiled JavaScript
 * by intercepting specific function calls related to API URLs.
 */
(function() {
  console.log('[URL Fix] Running direct URL patch script');
  
  // Intercept the fetch API
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    console.log('[URL Fix] Fetch intercepted:', url);
    
    if (typeof url === 'string' && url.includes('personalsite77.vercel.app')) {
      // Extract the path from the absolute URL
      const urlObj = new URL(url);
      const newUrl = urlObj.pathname + urlObj.search;
      console.log('[URL Fix] Converted absolute URL to relative:', newUrl);
      return originalFetch(newUrl, options);
    }
    
    return originalFetch(url, options);
  };
  
  // Create a global helper function that compiled code can use
  window.__fixApiUrl = function(url) {
    if (typeof url === 'string' && url.includes('personalsite77.vercel.app')) {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    }
    return url;
  };
  
  // Create helper for ajax
  const ajaxOriginalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    // Check if this is an API URL
    if (arguments.length >= 2 && 
        typeof arguments[1] === 'string' && 
        arguments[1].includes('personalsite77.vercel.app')) {
      
      const url = arguments[1];
      const urlObj = new URL(url);
      const newUrl = urlObj.pathname + urlObj.search;
      console.log('[URL Fix] Converted XHR URL to relative:', newUrl);
      
      // Replace the URL with the relative one
      arguments[1] = newUrl;
    }
    
    // Call the original open method
    return ajaxOriginalOpen.apply(this, arguments);
  };
  
  // Trigger reload if the page contains the signals admin UI
  setTimeout(function() {
    // Look for signals heading
    const heading = Array.from(document.querySelectorAll('h1')).find(
      h => h.textContent && h.textContent.includes('Manage Signals')
    );
    
    // If signals admin is detected, attempt to patch bundled code
    if (heading) {
      console.log('[URL Fix] Signals admin detected, patching bundled code');
      
      // Patch signals.js bundle
      const jsonp = window._jsonp || window.__NEXT_P || [];
      if (Array.isArray(jsonp) && jsonp.push) {
        const originalPush = jsonp.push;
        jsonp.push = function(item) {
          if (Array.isArray(item) && item.length >= 2 && item[0] === '/admin/signals') {
            console.log('[URL Fix] Patching signals module bundle');
            const originalModule = item[1];
            item[1] = function() {
              const result = originalModule.apply(this, arguments);
              console.log('[URL Fix] Signals module loaded, checking for URLs to patch');
              if (result && typeof result === 'object') {
                // Try to find the API URL in the bundle
                patchSignalsFunctions(result);
              }
              return result;
            };
          }
          return originalPush.call(this, item);
        };
      }
    }
  }, 500);
  
  // Function to patch signals-related functions in bundled code
  function patchSignalsFunctions(module) {
    if (!module) return;
    
    // Try to find functions that might use API URLs
    Object.keys(module).forEach(key => {
      const item = module[key];
      if (typeof item === 'function') {
        // Wrap the function to intercept API calls
        const original = item;
        module[key] = function() {
          // Before executing, check for URL arguments
          for (let i = 0; i < arguments.length; i++) {
            const arg = arguments[i];
            if (typeof arg === 'string' && arg.includes('personalsite77.vercel.app')) {
              console.log('[URL Fix] Patching URL in function argument:', arg);
              const urlObj = new URL(arg);
              arguments[i] = urlObj.pathname + urlObj.search;
            } else if (arg && typeof arg === 'object') {
              // Look for URL in object properties
              Object.keys(arg).forEach(propKey => {
                const propValue = arg[propKey];
                if (typeof propValue === 'string' && propValue.includes('personalsite77.vercel.app')) {
                  console.log('[URL Fix] Patching URL in object property:', propValue);
                  const urlObj = new URL(propValue);
                  arg[propKey] = urlObj.pathname + urlObj.search;
                }
              });
            }
          }
          
          // Execute the original function
          return original.apply(this, arguments);
        };
      } else if (item && typeof item === 'object') {
        // Recursively patch nested objects
        patchSignalsFunctions(item);
      }
    });
  }
  
  console.log('[URL Fix] Direct URL patch script installed');
})();