import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';

export default function ApiTestPage() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api/test-post');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      console.log(`Testing API: ${method} ${endpoint}`);
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // Add body for POST requests
      if (method === 'POST') {
        options.body = JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Test data from API test page'
        });
      }
      
      const res = await fetch(endpoint, options);
      console.log('Response status:', res.status);
      
      const data = await res.json();
      console.log('Response data:', data);
      
      setResponse(data);
    } catch (err) {
      console.error('Error testing API:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout section="admin">
      <Head>
        <title>API Test Page</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTTP Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isLoading ? 'Testing...' : 'Test API'}
            </button>
          </form>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong className="font-bold">Error: </strong>
            <span>{error}</span>
          </div>
        )}
        
        {response && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4">Response:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Layout>
  );
}
