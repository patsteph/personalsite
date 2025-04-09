// Base path for the application
export const basePath = '';

// Application settings
export const appConfig = {
  title: 'Personal Website',
  description: 'A personal website with blog, CV, and books',
  author: 'Patrick Stephenson',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  defaultLocale: 'en',
};

// Social media links
export const socialLinks = {
  github: 'https://github.com/patsteph',
  twitter: 'https://twitter.com/example',
  linkedin: 'https://linkedin.com/in/example',
};

// Runtime configuration helper - minimal version
export const getRuntimeConfig = () => {
  // For client-side, use window.runtimeConfig
  if (typeof window !== 'undefined') {
    try {
      if (window.runtimeConfig) {
        return window.runtimeConfig;
      }
    } catch (error) {
      console.warn('Error accessing window.runtimeConfig:', error);
    }
  }
  
  // Default fallback configuration
  return {
    basePath,
    isProduction: process.env.NODE_ENV === 'production'
  };
};