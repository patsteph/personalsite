// Script to diagnose Firebase configuration issues
console.log('Firebase check script loaded');

function checkFirebaseConfig() {
  console.log('Checking Firebase configuration...');
  
  const results = {
    runtimeConfig: window.runtimeConfig || null,
    secureConfig: window.SECURE_CONFIG || null,
    firebaseInitialized: false,
    collections: {
      books: false,
      'blog-posts': false
    }
  };
  
  // Initialize Firebase if needed
  try {
    // Check if Firebase is already initialized
    if (firebase.apps.length > 0) {
      console.log('Firebase is already initialized');
      results.firebaseInitialized = true;
    } else {
      let config;
      
      // Try to use SECURE_CONFIG
      if (window.SECURE_CONFIG?.firebase?.apiKey) {
        console.log('Using firebase config from SECURE_CONFIG');
        config = window.SECURE_CONFIG.firebase;
      }
      // Fallback to runtimeConfig
      else if (window.runtimeConfig?.firebase?.apiKey) {
        console.log('Using firebase config from runtimeConfig');
        config = window.runtimeConfig.firebase;
      }
      // No hardcoded values - security risk
      else {
        console.log('No Firebase config available');
        config = null;
      }
      
      if (config && config.apiKey) {
        firebase.initializeApp(config);
        console.log('Firebase initialized with config', JSON.stringify({
          projectId: config.projectId,
          hasApiKey: !!config.apiKey
        }));
        results.firebaseInitialized = true;
      } else {
        console.error('Firebase config is missing required fields');
      }
    }
    
    // Check collections
    if (results.firebaseInitialized) {
      const db = firebase.firestore();
      
      // Check books collection
      db.collection('books').limit(1).get()
        .then(snapshot => {
          results.collections.books = true;
          console.log('Books collection is accessible, found', snapshot.size, 'documents');
        })
        .catch(error => {
          console.error('Error accessing books collection:', error);
        });
        
      // Check blog-posts collection
      db.collection('blog-posts').limit(1).get()
        .then(snapshot => {
          results.collections['blog-posts'] = true;
          console.log('Blog posts collection is accessible, found', snapshot.size, 'documents');
        })
        .catch(error => {
          console.error('Error accessing blog-posts collection:', error);
        });
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
  
  console.log('Firebase check complete:', results);
  return results;
}

// In browser, this will execute immediately
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkFirebaseConfig, 1000); // Add a slight delay to ensure everything is loaded
  });
}