// pages/direct-login.tsx
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Bare-bones login page with no Next.js components
export default function DirectLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  
  // Direct login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    
    try {
      console.log('Attempting direct login');
      
      // Get Firebase config from environment variables
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };
      
      // Initialize the Firebase app
      initializeApp(firebaseConfig, 'direct-login-app');
      console.log('Firebase initialized');
      
      // Get auth
      const auth = getAuth();
      console.log('Auth obtained');
      
      // Sign in
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful');
      
      setStatus('success');
      
      // Store authentication info
      sessionStorage.setItem('direct_login_success', 'true');
      sessionStorage.setItem('direct_login_email', email);
      sessionStorage.setItem('direct_login_timestamp', new Date().toISOString());
      
      // Redirect to admin page - only in browser
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1000);
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed');
      setStatus('error');
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Direct Login</h1>
      
      {status === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Login successful! Redirecting to admin page...
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {status === 'loading' ? 'Signing In...' : 'Sign In'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/admin/login';
              }
            }}
            className="text-blue-500 hover:text-blue-800"
          >
            Back to normal login
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        This is a direct login page that bypasses Next.js routing and components.
        <br />
        It uses Firebase Auth directly to authenticate.
      </div>
    </div>
  );
}