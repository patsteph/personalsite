// pages/admin/signals-ultrasimple.tsx
// Ultra-simplified signals admin page that works around API issues
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Signal } from '@/types';

export default function SignalsUltraSimplePage() {
  const router = useRouter();
  
  // Local state
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'newsletter',
    title: '',
    description: '',
    url: '',
    publisher: '',
    frequency: 'weekly'
  });
  
  // Clear messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [successMessage, error]);
  
  // Load signals from the test endpoint
  const loadSignals = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get auth token
      const auth = await import('@/lib/firebase').then(m => m.auth);
      if (!auth) {
        throw new Error('Authentication not initialized');
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = await currentUser.getIdToken();
      
      console.log('Loading signals with method-specific GET endpoint');
      
      const response = await fetch('/api/signals-direct-get', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
      
      console.log('GET response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('GET response data:', data);
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Use actual data from the API
        setSignals(data.data);
        setSuccessMessage(`Loaded ${data.data.length} signals from the database`);
      } else {
        // Fallback to sample data if no real data exists
        setSignals([
          { 
            id: '1',
            type: 'newsletter',
            title: 'Sample Newsletter',
            description: 'This is a sample newsletter. No real signals exist yet.',
            url: 'https://example.com',
            publisher: 'Sample Publisher',
            frequency: 'weekly',
            subscriptionUrl: 'https://example.com/subscribe', // Required field for Newsletter type
            dateAdded: new Date().toISOString(),
            featured: false,
            tags: ['sample', 'test']
          }
        ]);
        setSuccessMessage('No signals found in database. Showing sample data.');
      }
      
    } catch (err) {
      console.error('Error loading signals:', err);
      setError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Get auth token
      const auth = await import('@/lib/firebase').then(m => m.auth);
      if (!auth) {
        throw new Error('Authentication not initialized');
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = await currentUser.getIdToken();
      
      console.log('Submitting signal to test endpoint');
      console.log('Form data:', formData);
      
      // Prepare signal data
      // Create properly typed signal data based on the form type
      const signalData = formData.type === 'newsletter'
        ? {
            ...formData,
            dateAdded: new Date().toISOString(),
            featured: false,
            tags: [],
            subscriptionUrl: formData.url, // Use the main URL as subscription URL if not provided
          }
        : {
            ...formData,
            dateAdded: new Date().toISOString(),
            featured: false,
            tags: [],
            author: 'Unknown', // Required for articles
            source: 'Unknown', // Required for articles
            publishDate: new Date().toISOString() // Required for articles
          };
      
      // Try direct fetch to method-specific POST endpoint
      const response = await fetch('/api/signals-direct-post', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify(signalData),
        cache: 'no-store'
      });
      
      console.log('POST response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('POST response data:', result);
      
      setSuccessMessage('Signal submitted successfully to test endpoint');
      setIsFormOpen(false);
      setFormData({
        type: 'newsletter',
        title: '',
        description: '',
        url: '',
        publisher: '',
        frequency: 'weekly'
      });
      
    } catch (err) {
      console.error('Error submitting signal:', err);
      setError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load signals when the component mounts
  useEffect(() => {
    loadSignals();
  }, []);
  
  return (
    <ProtectedRoute>
      <Layout section="admin">
        <Head>
          <title>Ultra Simple Signals Admin | Admin</title>
        </Head>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-steel-blue">Ultra Simple Signals Admin</h1>
            
            <div className="flex space-x-4">
              {!isFormOpen && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 bg-steel-blue text-white rounded-md hover:bg-opacity-90"
                >
                  Add New Signal
                </button>
              )}
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
          
          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          {isFormOpen ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Create New Signal</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signal Type</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="newsletter"
                        checked={formData.type === 'newsletter'}
                        onChange={handleInputChange}
                        className="form-radio"
                      />
                      <span className="ml-2">Newsletter</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="article"
                        checked={formData.type === 'article'}
                        onChange={handleInputChange}
                        className="form-radio"
                      />
                      <span className="ml-2">Article</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    URL *
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    required
                    value={formData.url}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
                  />
                </div>
                
                {formData.type === 'newsletter' && (
                  <>
                    <div>
                      <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">
                        Publisher *
                      </label>
                      <input
                        type="text"
                        id="publisher"
                        name="publisher"
                        required
                        value={formData.publisher}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                        Frequency *
                      </label>
                      <select
                        id="frequency"
                        name="frequency"
                        required
                        value={formData.frequency}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-steel-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Create Signal'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Signal
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type / Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Added
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {signals.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                          No signals found. Create your first signal.
                        </td>
                      </tr>
                    ) : (
                      signals.map(signal => (
                        <tr key={signal.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{signal.title}</div>
                                <div className="text-sm text-gray-500">{signal.description.substring(0, 50)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              signal.type === 'newsletter' 
                                ? 'bg-indigo-100 text-indigo-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {signal.type}
                            </span>
                            <div className="text-sm text-gray-500 mt-1">
                              {signal.type === 'newsletter' 
                                ? `${signal.publisher} • ${signal.frequency}` 
                                : `${(signal as any).author || 'Unknown'} • ${(signal as any).source || 'Unknown'}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(signal.dateAdded).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">API Diagnostic Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium">Test POST Request</h3>
                <p className="text-sm text-gray-600">
                  Click the button below to test a direct POST request to the test endpoint:
                </p>
                <button 
                  onClick={async () => {
                    try {
                      const auth = await import('@/lib/firebase').then(m => m.auth);
                      const currentUser = auth?.currentUser;
                      const token = currentUser ? await currentUser.getIdToken() : null;
                      
                      console.log('Testing direct POST with token:', token ? 'available' : 'not available');
                      
                      const testData = {
                        title: 'Test Signal',
                        description: 'This is a test signal',
                        type: 'newsletter',
                        dateAdded: new Date().toISOString(),
                        url: 'https://example.com',
                        publisher: 'Test Publisher',
                        frequency: 'weekly',
                        subscriptionUrl: 'https://example.com/subscribe',
                        featured: false,
                        tags: ['test']
                      };
                      
                      const response = await fetch('/api/signals-direct-post', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(testData)
                      });
                      
                      console.log('Direct POST test response:', response.status);
                      const data = await response.json();
                      console.log('Direct POST test data:', data);
                      
                      setSuccessMessage(`Test POST successful: ${response.status} ${response.statusText}`);
                    } catch (err) {
                      console.error('Test POST failed:', err);
                      setError(`Test POST failed: ${err instanceof Error ? err.message : String(err)}`);
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  Test Direct POST Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}