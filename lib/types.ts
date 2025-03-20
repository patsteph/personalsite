// Runtime configuration interface
export interface RuntimeConfig {
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

// Extend the Window interface to include the runtime config
declare global {
  interface Window {
    runtimeConfig?: RuntimeConfig;
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}