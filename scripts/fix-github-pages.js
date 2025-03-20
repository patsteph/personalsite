#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Configuration
const outDir = path.resolve(process.cwd(), 'out');
const basePath = '/personalsite';
const personalSiteDir = path.join(outDir, 'personalsite');

console.log('Starting GitHub Pages deployment fixes...');

/**
 * Ensure a directory exists
 */
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Clean up nested directories to prevent path duplication
 */
function cleanupNestedDirs() {
  const nestedDir = path.join(outDir, 'personalsite', 'personalsite');
  if (fs.existsSync(nestedDir)) {
    console.log('Removing nested personalsite directory...');
    fs.rmSync(nestedDir, { recursive: true, force: true });
  }
}

/**
 * Clean up any nested personalsite directories
 */
function cleanupNestedStructures() {
  console.log('Cleaning up nested paths...');
  
  // Just remove any nested personalsite directories to avoid path confusion
  const nestedDir = path.join(personalSiteDir, 'personalsite');
  if (fs.existsSync(nestedDir)) {
    try {
      fs.rmSync(nestedDir, { recursive: true, force: true });
      console.log('Removed nested personalsite directory');
    } catch (error) {
      console.error('Error removing nested directory:', error);
    }
  }
}

/**
 * Fix the root index.html file to ensure it works without redirects
 */
function fixRootIndex() {
  console.log('Fixing root index.html to properly load the site directly...');
  
  const indexPath = path.join(outDir, 'index.html');
  
  // The root index.html already exists from Next.js export
  if (fs.existsSync(indexPath)) {
    try {
      let content = fs.readFileSync(indexPath, 'utf8');
      
      // Ensure all paths are properly prefixed 
      content = content.replace(/href="\/_next\//g, 'href="/_next/');
      content = content.replace(/src="\/_next\//g, 'src="/_next/');
      
      // Write back the fixed content
      fs.writeFileSync(indexPath, content);
      console.log('Root index.html fixed for direct access');
    } catch (error) {
      console.error('Error fixing root index.html:', error);
    }
  } else {
    console.warn('Warning: root index.html not found, cannot fix');
  }
}

/**
 * Copy runtime configuration to necessary locations
 */
function copyRuntimeConfig() {
  console.log('Copying runtime configuration...');
  const configPath = path.join(process.cwd(), 'public', 'runtime-config.js');
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    // Copy to root
    fs.writeFileSync(path.join(outDir, 'runtime-config.js'), config);
    // Copy to personalsite directory
    fs.writeFileSync(path.join(personalSiteDir, 'runtime-config.js'), config);
    // Copy to _next directory if it exists
    const nextDir = path.join(outDir, '_next');
    if (fs.existsSync(nextDir)) {
      fs.writeFileSync(path.join(nextDir, 'runtime-config.js'), config);
    }
  } else {
    console.log('Warning: runtime-config.js not found in public directory');
  }
}

/**
 * Create GitHub Pages specific files
 */
function createGitHubPagesFiles() {
  // Create .nojekyll in root and personalsite directories
  console.log('Creating .nojekyll files...');
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(personalSiteDir, '.nojekyll'), '');
}

/**
 * Create standalone admin HTML that works outside Next.js
 */
function createStandaloneAdmin() {
  console.log('Creating standalone admin access page...');
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Access</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
    }
    .container {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px;
      margin-top: 40px;
    }
    form {
      margin-bottom: 20px;
    }
    input {
      display: block;
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      background-color: #0070f3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin: 10px 0;
      width: 100%;
    }
    button.secondary {
      background-color: #6c757d;
    }
    #status {
      margin-top: 20px;
      padding: 10px;
      border-radius: 4px;
    }
    .success {
      background-color: #d4edda;
      color: #155724;
    }
    .error {
      background-color: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Admin Access</h1>
    
    <!-- Login Form -->
    <form id="loginForm">
      <input type="email" id="email" placeholder="Email" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Sign In</button>
    </form>
    
    <!-- Bypass Button -->
    <button id="bypassButton" class="secondary">Bypass Authentication</button>
    
    <div id="status"></div>
  </div>
  
  <!-- Add Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
  
  <script>
    // Status element for messages
    const statusEl = document.getElementById('status');
    
    // Load Firebase config from runtime-config if available
    let firebaseConfig;
    
    try {
      // Try to load from runtime-config.js
      const script = document.createElement('script');
      script.src = '/runtime-config.js';
      document.head.appendChild(script);
      
      // Wait for script to load
      script.onload = function() {
        if (window.runtimeConfig && window.runtimeConfig.firebase) {
          firebaseConfig = window.runtimeConfig.firebase;
          initFirebase();
        } else {
          // Fallback config
          firebaseConfig = {
            apiKey: "AIzaSyD4a8iaxHP9xPGV5tR5LwvzDVa5Y9o5wGQ",
            authDomain: "personalsite-19189.firebaseapp.com",
            projectId: "personalsite-19189",
            storageBucket: "personalsite-19189.firebasestorage.app",
            messagingSenderId: "892517360036",
            appId: "1:892517360036:web:36dda234d9f3f79562e131"
          };
          initFirebase();
        }
      };
      
      // Handle script load failure
      script.onerror = function() {
        // Fallback config
        firebaseConfig = {
          apiKey: "AIzaSyD4a8iaxHP9xPGV5tR5LwvzDVa5Y9o5wGQ",
          authDomain: "personalsite-19189.firebaseapp.com",
          projectId: "personalsite-19189",
          storageBucket: "personalsite-19189.firebasestorage.app",
          messagingSenderId: "892517360036",
          appId: "1:892517360036:web:36dda234d9f3f79562e131"
        };
        initFirebase();
      };
    } catch (e) {
      console.error('Failed to load runtime config:', e);
      // Fallback config
      firebaseConfig = {
        apiKey: "AIzaSyD4a8iaxHP9xPGV5tR5LwvzDVa5Y9o5wGQ",
        authDomain: "personalsite-19189.firebaseapp.com",
        projectId: "personalsite-19189",
        storageBucket: "personalsite-19189.firebasestorage.app",
        messagingSenderId: "892517360036",
        appId: "1:892517360036:web:36dda234d9f3f79562e131"
      };
      initFirebase();
    }
    
    function initFirebase() {
      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      
      // Add auth state listener for debugging
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          console.log('User is signed in:', user.email);
        } else {
          console.log('No user is signed in');
        }
      });
    }
    
    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Clear previous messages
      statusEl.textContent = '';
      statusEl.className = '';
      
      // Sign in with Firebase
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in successfully
          // Store auth in session storage
          sessionStorage.setItem('auth_success', 'true');
          sessionStorage.setItem('auth_timestamp', new Date().toISOString());
          sessionStorage.setItem('bypass_auth', 'true');
          
          // Show status
          statusEl.textContent = 'Signed in successfully! Redirecting...';
          statusEl.className = 'success';
          
          // Redirect to admin page after a brief delay
          setTimeout(() => {
            window.location.href = '/personalsite/admin';
          }, 1000);
        })
        .catch((error) => {
          // Handle errors
          console.error('Authentication error:', error);
          
          // Show error message
          statusEl.textContent = 'Authentication error: ' + error.message;
          statusEl.className = 'error';
        });
    });
    
    // Bypass button handler
    document.getElementById('bypassButton').addEventListener('click', function() {
      // Store auth in session storage
      sessionStorage.setItem('auth_success', 'true');
      sessionStorage.setItem('auth_timestamp', new Date().toISOString());
      sessionStorage.setItem('bypass_auth', 'true');
      
      // Show status
      statusEl.textContent = 'Access granted! Redirecting...';
      statusEl.className = 'success';
      
      // Redirect to admin page after a brief delay
      setTimeout(() => {
        window.location.href = '/personalsite/admin';
      }, 1000);
    });
  </script>
</body>
</html>`;

  // Write to root output directory
  fs.writeFileSync(path.join(outDir, 'admin.html'), htmlContent);
}

/**
/**
 * Create a debug page to help diagnose issues
 * NOTE: This function has been commented out as debug.html has been moved to _old directory
 */
// function createDebugPage() {
//   console.log('Creating debug page...');
//   const debugHtml = `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Site Debug Info</title>
//   <style>
//     body {
//       font-family: monospace;
//       padding: 20px;
//       max-width: 800px;
//       margin: 0 auto;
//     }
//     h1 {
//       color: #333;
//     }
//     .section {
//       background: #f5f5f5;
//       padding: 15px;
//       border-radius: 5px;
//       margin-bottom: 20px;
//     }
//     pre {
//       background: #eee;
//       padding: 10px;
//       overflow: auto;
//     }
//     .success {
//       color: green;
//     }
//     .error {
//       color: red;
//     }
//   </style>
// </head>
// <body>
//   <h1>Site Debug Information</h1>
//   
//   <div class="section">
//     <h2>Path Information</h2>
//     <div id="pathInfo"></div>
//   </div>
//   
//   <div class="section">
//     <h2>Session Storage</h2>
//     <div id="sessionInfo"></div>
//     <button id="clearSession">Clear Session Storage</button>
//   </div>
//   
//   <div class="section">
//     <h2>Quick Actions</h2>
//     <button id="toHome">Go to Home</button>
//     <button id="toAdmin">Go to Admin</button>
//     <button id="setAuth">Set Auth Bypass</button>
//   </div>
//   
//   <script>
//     // Display path information
//     const pathInfo = document.getElementById('pathInfo');
//     pathInfo.innerHTML = \`<pre>
// Current URL: \${window.location.href}
// Pathname: \${window.location.pathname}
// Base path: /personalsite
// </pre>\`;
// 
//     // Display session storage information
//     function updateSessionInfo() {
//       const sessionInfo = document.getElementById('sessionInfo');
//       let sessionContent = '';
//       
//       for (let i = 0; i < sessionStorage.length; i++) {
//         const key = sessionStorage.key(i);
//         sessionContent += \`\${key}: \${sessionStorage.getItem(key)}\\n\`;
//       }
//       
//       if (sessionContent === '') {
//         sessionContent = '(No session storage items found)';
//       }
//       
//       sessionInfo.innerHTML = \`<pre>\${sessionContent}</pre>\`;
//       
//       // Check auth status
//       const hasAuth = sessionStorage.getItem('auth_success') === 'true';
//       sessionInfo.innerHTML += \`<p class="\${hasAuth ? 'success' : 'error'}">Authentication status: \${hasAuth ? 'Authenticated' : 'Not authenticated'}</p>\`;
//     }
//     
//     // Initial update
//     updateSessionInfo();
//     
//     // Setup buttons
//     document.getElementById('clearSession').addEventListener('click', function() {
//       sessionStorage.clear();
//       updateSessionInfo();
//       alert('Session storage cleared');
//     });
//     
//     document.getElementById('toHome').addEventListener('click', function() {
//       window.location.href = '/personalsite/';
//     });
//     
//     document.getElementById('toAdmin').addEventListener('click', function() {
//       window.location.href = '/personalsite/admin';
//     });
//     
//     document.getElementById('setAuth').addEventListener('click', function() {
//       sessionStorage.setItem('auth_success', 'true');
//       sessionStorage.setItem('auth_timestamp', new Date().toISOString());
//       sessionStorage.setItem('bypass_auth', 'true');
//       updateSessionInfo();
//       alert('Auth bypass set');
//     });
//   </script>
// </body>
// </html>`;
// 
//   // Write to output directory
//   fs.writeFileSync(path.join(outDir, 'debug.html'), debugHtml);
// }
/**
 * Update HTML files to fix path references
 */
function fixPathReferences() {
  console.log('Fixing path references in HTML files...');
  
  const handleDirectory = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        handleDirectory(fullPath);
      } else if (entry.name.endsWith('.html')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Remove any instances of doubled paths
        content = content.replace(/href="\/personalsite\/personalsite\//g, 'href="/personalsite/');
        content = content.replace(/src="\/personalsite\/personalsite\//g, 'src="/personalsite/');
        
        // Ensure all assets use absolute paths with the correct basePath
        content = content.replace(/"(\.\.\/)*_next\//g, '"/personalsite/_next/');
        
        // Fix script src and asset paths - ensure proper prefixing
        content = content.replace(/src="\/_next\//g, 'src="/personalsite/_next/');
        content = content.replace(/href="\/_next\//g, 'href="/personalsite/_next/');
        
        // Also fix paths without leading slash (these might be causing 404s)
        content = content.replace(/src="_next\//g, 'src="/personalsite/_next/');
        content = content.replace(/href="_next\//g, 'href="/personalsite/_next/');
        
        // Fix image and other asset references
        content = content.replace(/src="\/images\//g, 'src="/personalsite/images/');
        content = content.replace(/href="\/styles\.css/g, 'href="/personalsite/styles.css');
        
        // Fix direct references to other pages
        content = content.replace(/href="\/admin\//g, 'href="/personalsite/admin/');
        content = content.replace(/href="\/blog\//g, 'href="/personalsite/blog/');
        content = content.replace(/href="\/books/g, 'href="/personalsite/books');
        content = content.replace(/href="\/contact/g, 'href="/personalsite/contact');
        content = content.replace(/href="\/cv/g, 'href="/personalsite/cv');
        
        // Write back the fixed content
        fs.writeFileSync(fullPath, content);
      }
    }
  };
  
  handleDirectory(outDir);
}

/**
 * Ensure _next directory is properly copied
 */
function fixNextDirectory() {
  console.log('Ensuring _next directory is properly set up...');
  
  const outNextDir = path.join(outDir, '_next');
  if (!fs.existsSync(outNextDir)) {
    console.log('_next directory not found in out directory');
    return;
  }
  
  // Create _next directory in personalsite folder if it doesn't exist
  const personalSiteNextDir = path.join(personalSiteDir, '_next');
  if (!fs.existsSync(personalSiteNextDir)) {
    fs.mkdirSync(personalSiteNextDir, { recursive: true });
  }
  
  // Copy key files from _next to personalsite/_next if they don't exist there
  const copyNextFiles = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyNextFiles(srcPath, destPath);
      } else {
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  };
  
  copyNextFiles(outNextDir, personalSiteNextDir);
}

/**
 * Create manifest files to prevent 404s
 */
function createManifestFiles() {
  console.log('Creating manifest files...');
  
  // Create minimal manifest files to prevent 404s
  const buildManifest = `{
  "polyfillFiles": [],
  "devFiles": [],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [],
  "pages": {
    "/": []
  },
  "ampFirstPages": []
}`;

  const ssgManifest = `{
  "pages": {}
}`;

  // Write to root directory
  fs.writeFileSync(path.join(outDir, '_buildManifest.js'), `self.__BUILD_MANIFEST = ${buildManifest};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()`);
  fs.writeFileSync(path.join(outDir, '_ssgManifest.js'), `self.__SSG_MANIFEST = ${ssgManifest};self.__SSG_MANIFEST_CB && self.__SSG_MANIFEST_CB()`);
  
  // Write to personalsite directory
  fs.writeFileSync(path.join(personalSiteDir, '_buildManifest.js'), `self.__BUILD_MANIFEST = ${buildManifest};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()`);
  fs.writeFileSync(path.join(personalSiteDir, '_ssgManifest.js'), `self.__SSG_MANIFEST = ${ssgManifest};self.__SSG_MANIFEST_CB && self.__SSG_MANIFEST_CB()`);
  
  // Write to _next directory
  const nextDir = path.join(outDir, '_next');
  if (fs.existsSync(nextDir)) {
    fs.writeFileSync(path.join(nextDir, '_buildManifest.js'), `self.__BUILD_MANIFEST = ${buildManifest};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()`);
    fs.writeFileSync(path.join(nextDir, '_ssgManifest.js'), `self.__SSG_MANIFEST = ${ssgManifest};self.__SSG_MANIFEST_CB && self.__SSG_MANIFEST_CB()`);
  }
  
  // Write to personalsite/_next directory
  const personalSiteNextDir = path.join(personalSiteDir, '_next');
  if (fs.existsSync(personalSiteNextDir)) {
    fs.writeFileSync(path.join(personalSiteNextDir, '_buildManifest.js'), `self.__BUILD_MANIFEST = ${buildManifest};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()`);
    fs.writeFileSync(path.join(personalSiteNextDir, '_ssgManifest.js'), `self.__SSG_MANIFEST = ${ssgManifest};self.__SSG_MANIFEST_CB && self.__SSG_MANIFEST_CB()`);
  }
}

/**
 * Function to copy site files from personalsite/ to root
 */
function copyMainSiteToRoot() {
  console.log('Copying main site files to root directory...');
  
  // Get all files from personalsite
  const files = fs.readdirSync(personalSiteDir);
  
  // Copy each file to root
  files.forEach(file => {
    const sourcePath = path.join(personalSiteDir, file);
    const destPath = path.join(outDir, file);
    
    // Skip directories
    if (fs.statSync(sourcePath).isDirectory()) {
      return;
    }
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to root`);
    } catch (error) {
      console.error(`Error copying ${file} to root:`, error);
    }
  });
}

/**
 * Create admin redirection
 */
function createAdminRedirection() {
  console.log('Creating admin redirection...');
  
  // Ensure admin directory exists
  const adminDir = path.join(outDir, 'admin');
  if (!fs.existsSync(adminDir)) {
    fs.mkdirSync(adminDir, { recursive: true });
  }
  
  // Copy admin-redirect.html to admin directory as index.html
  const sourceFile = path.join(process.cwd(), 'public', 'admin-redirect.html');
  const destFile = path.join(adminDir, 'index.html');
  
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log('Created admin redirection at', destFile);
  } else {
    console.warn('Warning: admin-redirect.html not found in public directory');
  }
  
  // Also add to personalsite/admin directory
  const personalSiteAdminDir = path.join(personalSiteDir, 'admin');
  if (!fs.existsSync(personalSiteAdminDir)) {
    fs.mkdirSync(personalSiteAdminDir, { recursive: true });
  }
  
  const personalSiteDestFile = path.join(personalSiteAdminDir, 'index.html');
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, personalSiteDestFile);
    console.log('Created admin redirection at', personalSiteDestFile);
  }
}

/**
 * Main function
 */
function main() {
  try {
    ensureDirectory(outDir);
    ensureDirectory(personalSiteDir);
    
    // First, clean up any problematic nested directories
    cleanupNestedDirs();
    cleanupNestedStructures();
    
    // Fix path references in all HTML files
    fixPathReferences();
    
    // Ensure the root index.html works directly
    fixRootIndex();
    
    // Add essential build files and configurations
    fixNextDirectory();
    copyRuntimeConfig();
    createManifestFiles();
    createGitHubPagesFiles();
    
    // Add administrative tools
    createStandaloneAdmin();
    createAdminRedirection();
    // createDebugPage(); // Debug page creation disabled - moved to _old directory
    
    console.log('GitHub Pages deployment fixes completed successfully');
  } catch (error) {
    console.error('Error during GitHub Pages fixes:', error);
    process.exit(1);
  }
}

main();