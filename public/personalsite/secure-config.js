
// This file is generated at build time by the CI/CD process
// It contains configuration that comes from secure environment variables
window.SECURE_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  googleBooks: {
    apiKey: ""
  },
  basePath: "",
  isProduction: false
};

// Standard hosting - no base path detection needed
console.log('Using empty base path for standard hosting');
