
// This file is generated at build time by the CI/CD process
// It contains configuration that comes from secure environment variables
window.SECURE_CONFIG = {
  firebase: {
    apiKey: "placeholder-api-key",
    authDomain: "placeholder-auth-domain",
    projectId: "placeholder-project-id",
    storageBucket: "",
    messagingSenderId: "",
    appId: "placeholder-app-id"
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
