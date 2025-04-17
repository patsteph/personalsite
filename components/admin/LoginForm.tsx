import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('>>> handleSubmit function entered <<<');

    // Prevent double-submission
    if (loading) {
      console.log('Form submission blocked - already processing');
      return;
    }

    console.log('Login form submit triggered');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Log before authentication attempt
      console.log('Attempting authentication...');

      // Perform authentication
      await signIn(email, password);
      console.log('LoginForm: Sign in successful');

      // No longer need to handle redirect here or call onSuccess.
      // The parent component's useEffect will handle redirect based on useAuth state.
      setLoading(false); // Set loading false on success too
    } catch (error) {
      console.error('Login error:', error);
      // Ensure error is a string for display
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during login.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-4 sm:p-8">
      <h2 className="text-2xl font-bold text-accent mb-6">
        Admin Login
      </h2>

      <form onSubmit={handleSubmit} id="admin-login-form">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4" role="alert">
            <span className="font-medium">Error: </span>{error}
          </div>
        )}

        <div className="mb-4">
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue"
            required
            autoComplete="email"
            inputMode="email"
            aria-label="Email address"
            minLength={5}
            maxLength={50}
            placeholder="your@email.com"
          />
        </div>

        <div className="mb-6">
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue"
            required
            autoComplete="current-password"
            aria-label="Password"
            minLength={6}
          />
        </div>

        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            console.log('🔥 button clicked');
            handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
          }}
          disabled={loading}
          className={`
            w-full h-12 bg-steel-blue hover:bg-accent text-white font-medium py-3 px-4 rounded
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue
            ${loading ? 'opacity-70 cursor-not-allowed' : ''}
            text-base sm:text-lg
          `}
          aria-label={loading ? 'Signing in...' : 'Sign In'}
        >
          {loading ? 'Signing in...' : 'Debug'}
        </button>
      </form>
    </div>
  );
}