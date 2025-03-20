import { useState } from 'react';
import { useAuth } from '@/lib/auth';

type LoginFormProps = {
  onSuccess?: () => void;
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Perform authentication
      await signIn(email, password);
      console.log('LoginForm: Sign in successful');
      
      // Call onSuccess which will handle the redirect in the parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
    } finally {
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
          type="submit"
          disabled={loading}
          className={`
            w-full h-12 bg-steel-blue hover:bg-accent text-white font-medium py-3 px-4 rounded
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue
            ${loading ? 'opacity-70 cursor-not-allowed' : ''}
            text-base sm:text-lg
          `}
          aria-label={loading ? 'Signing in...' : 'Sign In'}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}