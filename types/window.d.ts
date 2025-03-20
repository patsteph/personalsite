interface RuntimeConfig {
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  basePath?: string;
  isProduction?: boolean;
}

// Define the secure configuration structure
interface SecureConfig {
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  googleBooks?: {
    apiKey: string;
  };
  basePath?: string;
  isProduction?: boolean;
}

interface Window {
  runtimeConfig?: RuntimeConfig;
  __RUNTIME_CONFIG__?: RuntimeConfig;
  SECURE_CONFIG?: SecureConfig;
  firebase?: any; // Added for firebase global object
  // These fields are added for direct Firebase access 
  firebaseApp?: any;
  firebaseAuth?: any;
  firebaseFirestore?: any;
}