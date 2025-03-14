
// This file is generated at build time by the CI/CD process
// It contains configuration that comes from secure environment variables
window.SECURE_CONFIG = {
  firebase: {
    apiKey: "AIzaSyD4a8iaxHP9xPGV5tR5LwvzDVa5Y9o5wGQ",
    authDomain: "personalsite-19189.firebaseapp.com",
    projectId: "personalsite-19189",
    storageBucket: "personalsite-19189.appspot.com",
    messagingSenderId: "892517360036",
    appId: "1:892517360036:web:36dda234d9f3f79562e131"
  },
  basePath: "",
  isProduction: false
};

// For GitHub Pages, automatically detect the correct base path
(function detectBasePath() {
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    const pathMatch = window.location.pathname.match(/^\/([^/]+)/);
    if (pathMatch) {
      window.SECURE_CONFIG.basePath = pathMatch[0];
      console.log('Detected GitHub Pages path:', window.SECURE_CONFIG.basePath);
    }
  }
})();
