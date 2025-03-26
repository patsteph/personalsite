import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ApiStatus() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});

  const testEndpoints = [
    '/api/debug-firestore',
    '/api/test-post',
    '/api/test-signal-direct-post',
    '/api/signals-debug-simple'
  ];
  
  const testEndpoint = async (endpoint: string) => {
    setLoading(prev => ({ ...prev, [endpoint]: true }));
    setError(prev => ({ ...prev, [endpoint]: '' }));
    
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await fetch(endpoint);
      console.log(`Status: ${response.status}`);
      
      const data = await response.json();
      console.log(`Response:`, data);
      
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          success: response.ok,
          data
        }
      }));
    } catch (err) {
      console.error(`Error testing ${endpoint}:`, err);
      setError(prev => ({ 
        ...prev, 
        [endpoint]: err instanceof Error ? err.message : String(err)
      }));
    } finally {
      setLoading(prev => ({ ...prev, [endpoint]: false }));
    }
  };
  
  const testPostEndpoint = async (endpoint: string) => {
    setLoading(prev => ({ ...prev, [`${endpoint}-POST`]: true }));
    setError(prev => ({ ...prev, [`${endpoint}-POST`]: '' }));
    
    try {
      console.log(`Testing POST to endpoint: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      });
      console.log(`Status: ${response.status}`);
      
      const data = await response.json();
      console.log(`Response:`, data);
      
      setResults(prev => ({
        ...prev,
        [`${endpoint}-POST`]: {
          status: response.status,
          success: response.ok,
          data
        }
      }));
    } catch (err) {
      console.error(`Error testing POST to ${endpoint}:`, err);
      setError(prev => ({ 
        ...prev, 
        [`${endpoint}-POST`]: err instanceof Error ? err.message : String(err)
      }));
    } finally {
      setLoading(prev => ({ ...prev, [`${endpoint}-POST`]: false }));
    }
  };
  
  const testAllEndpoints = () => {
    testEndpoints.forEach(endpoint => {
      testEndpoint(endpoint);
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>API Status</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-6">API Status Dashboard</h1>
      
      <div className="space-y-2 mb-6">
        <button 
          onClick={testAllEndpoints}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test All GET Endpoints
        </button>
        
        <div className="space-x-2">
          {testEndpoints.map(endpoint => (
            <button
              key={endpoint}
              onClick={() => testPostEndpoint(endpoint)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test POST: {endpoint}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testEndpoints.map(endpoint => (
          <div key={endpoint} className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">{endpoint}</h2>
            
            <div className="space-y-4">
              {/* GET Result */}
              <div>
                <h3 className="font-medium">GET</h3>
                {loading[endpoint] ? (
                  <p>Testing...</p>
                ) : error[endpoint] ? (
                  <div className="text-red-600">
                    <p>Error: {error[endpoint]}</p>
                  </div>
                ) : results[endpoint] ? (
                  <div>
                    <div className={`text-sm ${results[endpoint].success ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {results[endpoint].status}
                    </div>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40 mt-2">
                      {JSON.stringify(results[endpoint].data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500">Not tested</p>
                )}
                
                <button
                  onClick={() => testEndpoint(endpoint)}
                  className="mt-2 px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Test GET
                </button>
              </div>
              
              {/* POST Result */}
              <div>
                <h3 className="font-medium">POST</h3>
                {loading[`${endpoint}-POST`] ? (
                  <p>Testing...</p>
                ) : error[`${endpoint}-POST`] ? (
                  <div className="text-red-600">
                    <p>Error: {error[`${endpoint}-POST`]}</p>
                  </div>
                ) : results[`${endpoint}-POST`] ? (
                  <div>
                    <div className={`text-sm ${results[`${endpoint}-POST`].success ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {results[`${endpoint}-POST`].status}
                    </div>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40 mt-2">
                      {JSON.stringify(results[`${endpoint}-POST`].data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500">Not tested</p>
                )}
                
                <button
                  onClick={() => testPostEndpoint(endpoint)}
                  className="mt-2 px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Test POST
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment Information</h2>
        <div className="text-sm">
          <div>Next.js Environment: {process.env.NODE_ENV}</div>
          <div>Firestore Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not available in client'}</div>
        </div>
      </div>
    </div>
  );
}