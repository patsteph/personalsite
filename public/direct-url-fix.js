/**
 * Direct URL Fix Script
 * This script directly searches for and replaces the hardcoded URL in loaded JavaScript
 */
(function() {
  console.log('Direct URL Fix Script loaded');
  
  // The problematic URL patterns to search for
  const HARDCODED_URLS = [
    'https://personalsite77.vercel.app/api/signals',
    'personalsite77.vercel.app/api/signals',
    '/api/signals'
  ];
  const REPLACEMENT_URL = '/api/signals-simple';
  
  // Track script elements we've already processed
  const processedScripts = new Set();
  
  // Function to fix URLs in script content
  function fixUrlsInScript(scriptElement) {
    if (processedScripts.has(scriptElement)) {
      return;
    }
    
    try {
      // Get script content
      const scriptContent = scriptElement.textContent || '';
      
      // Check if it contains any of the hardcoded URLs
      let foundMatch = false;
      let fixedContent = scriptContent;
      
      for (const hardcodedUrl of HARDCODED_URLS) {
        if (scriptContent.includes(hardcodedUrl)) {
          console.log('Found hardcoded URL in script:', hardcodedUrl, scriptElement.src || '(inline script)');
          fixedContent = fixedContent.replace(new RegExp(hardcodedUrl, 'g'), REPLACEMENT_URL);
          foundMatch = true;
        }
      }
      
      // Only proceed if we found a match
      if (foundMatch) {
        // Create a new script element with fixed content
        const newScript = document.createElement('script');
        newScript.textContent = fixedContent;
        
        // Copy attributes from original script
        Array.from(scriptElement.attributes).forEach(attr => {
          if (attr.name !== 'src') { // Don't copy src attribute for inline scripts
            newScript.setAttribute(attr.name, attr.value);
          }
        });
        
        // Replace the original script with the fixed one
        scriptElement.parentNode.replaceChild(newScript, scriptElement);
        console.log('Replaced script with fixed version');
      }
      
      processedScripts.add(scriptElement);
    } catch (error) {
      console.error('Error fixing URLs in script:', error);
    }
  }
  
  // Process existing scripts
  Array.from(document.scripts).forEach(fixUrlsInScript);
  
  // Set up a MutationObserver to handle dynamically added scripts
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.tagName === 'SCRIPT') {
          fixUrlsInScript(node);
        }
      });
    });
  });
  
  // Start observing the document
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // Also patch the fetch function to handle any remaining cases
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string') {
      for (const hardcodedUrl of HARDCODED_URLS) {
        if (url.includes(hardcodedUrl)) {
          console.log('Direct URL Fix: Intercepting fetch to hardcoded URL:', url);
          url = url.replace(hardcodedUrl, REPLACEMENT_URL);
          console.log('Direct URL Fix: Redirecting to:', url);
          break;
        }
      }
    }
    return originalFetch(url, options);
  };
  
  console.log('Direct URL Fix Script initialized');
})();