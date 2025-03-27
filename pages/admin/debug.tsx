/**
 * Debug page to test authentication and API connectivity
 */
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { auth as firebaseAuth, firestore as firestoreInstance } from '@/lib/firebase';

export default function DebugPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [tokenStatus, setTokenStatus] = useState<string>('No token');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Checking...');
  const [apiStatuses, setApiStatuses] = useState<{[key: string]: string}>({
    contentManagerGet: 'Not tested',
    contentManagerPost: 'Not tested',
    basicTest: 'Not tested',
  });
  const [logs, setLogs] = useState<string[]>([]);

  // Function to add logs
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  // Check auth status
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        setAuthStatus(`Authenticated as ${user.email}`);
        
        // Try to get token
        const getToken = async () => {
          try {
            const token = await user.getIdToken();
            setTokenStatus(`Token available (${token.substring(0, 10)}...)`);
            addLog('Successfully retrieved auth token');
          } catch (error) {
            setTokenStatus(`Error getting token: ${error instanceof Error ? error.message : String(error)}`);
            addLog(`Failed to get token: ${error instanceof Error ? error.message : String(error)}`);
          }
        };
        
        getToken();
      } else {
        setAuthStatus('Not authenticated');
        addLog('User is not authenticated');
      }
    }
  }, [loading, isAuthenticated, user]);

  // Check Firestore status
  useEffect(() => {
    const checkFirestore = () => {
      if (firestoreInstance) {
        setFirestoreStatus('Firestore instance available');
        addLog('Firestore instance is available');
      } else {
        setFirestoreStatus('Firestore not initialized');
        addLog('Firestore is not initialized');
      }
    };
    
    checkFirestore();
  }, []);

  // Test content-manager-get endpoint
  const testContentManagerGet = async () => {
    try {
      addLog('Testing /api/content-manager-get endpoint');
      setApiStatuses(prev => ({ ...prev, contentManagerGet: 'Testing...' }));
      
      const response = await fetch('/api/content-manager-get');
      
      addLog(`GET response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        setApiStatuses(prev => ({ 
          ...prev, 
          contentManagerGet: `Success (${response.status}), found ${data.data?.length || 0} items` 
        }));
        addLog(`Successfully retrieved ${data.data?.length || 0} signals`);
      } else {
        const text = await response.text();
        setApiStatuses(prev => ({ 
          ...prev, 
          contentManagerGet: `Failed (${response.status}): ${text.substring(0, 50)}` 
        }));
        addLog(`API error: ${response.status} - ${text}`);
      }
    } catch (error) {
      setApiStatuses(prev => ({ 
        ...prev, 
        contentManagerGet: `Error: ${error instanceof Error ? error.message : String(error)}` 
      }));
      addLog(`Exception: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Test basic test endpoint (minimal dependencies)
  const testBasicEndpoint = async () => {
    try {
      addLog('Testing /api/basic-test endpoint - GET');
      setApiStatuses(prev => ({ ...prev, basicTest: 'Testing...' }));
      
      // First test GET
      const getResponse = await fetch('/api/basic-test');
      addLog(`GET response status: ${getResponse.status}`);
      
      if (getResponse.ok) {
        const getData = await getResponse.json();
        addLog(`GET success: ${JSON.stringify(getData).substring(0, 100)}...`);
        
        // Now test POST
        addLog('Testing /api/basic-test endpoint - POST');
        const postData = { test: true, timestamp: new Date().toISOString() };
        
        const postResponse = await fetch('/api/basic-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        });
        
        addLog(`POST response status: ${postResponse.status}`);
        
        if (postResponse.ok) {
          const postResult = await postResponse.json();
          setApiStatuses(prev => ({ 
            ...prev, 
            basicTest: `Success - GET: ${getResponse.status}, POST: ${postResponse.status}`
          }));
          addLog(`POST success: ${JSON.stringify(postResult).substring(0, 100)}...`);
        } else {
          const postText = await postResponse.text();
          setApiStatuses(prev => ({ 
            ...prev, 
            basicTest: `Mixed - GET: OK, POST: Failed (${postResponse.status})`
          }));
          addLog(`POST error: ${postResponse.status} - ${postText}`);
        }
      } else {
        const getText = await getResponse.text();
        setApiStatuses(prev => ({ 
          ...prev, 
          basicTest: `Failed - GET: ${getResponse.status}` 
        }));
        addLog(`GET error: ${getResponse.status} - ${getText}`);
      }
    } catch (error) {
      setApiStatuses(prev => ({ 
        ...prev, 
        basicTest: `Error: ${error instanceof Error ? error.message : String(error)}` 
      }));
      addLog(`Exception: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test content-manager-post endpoint
  const testContentManagerPost = async () => {
    if (!user) {
      setApiStatuses(prev => ({ ...prev, contentManagerPost: 'Error: Not authenticated' }));
      addLog('Cannot test POST without authentication');
      return;
    }
    
    try {
      addLog('Testing /api/content-manager-post endpoint');
      setApiStatuses(prev => ({ ...prev, contentManagerPost: 'Testing...' }));
      
      // Get token
      const token = await user.getIdToken();
      addLog(`Got token for POST request`);
      
      // Test data
      const testData = {
        type: 'newsletter',
        title: `Test ${new Date().toISOString()}`,
        description: 'Debug test newsletter',
        url: 'https://example.com/debug',
        publisher: 'Debug Tester',
        frequency: 'daily',
        tags: ['debug', 'test'],
        featured: false
      };
      
      // Send request
      const response = await fetch('/api/content-manager-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });
      
      addLog(`POST response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        setApiStatuses(prev => ({ 
          ...prev, 
          contentManagerPost: `Success (${response.status}), created item with ID: ${data.data?.id || 'unknown'}` 
        }));
        addLog(`Successfully created signal with ID: ${data.data?.id || 'unknown'}`);
      } else {
        const text = await response.text();
        setApiStatuses(prev => ({ 
          ...prev, 
          contentManagerPost: `Failed (${response.status}): ${text.substring(0, 50)}` 
        }));
        addLog(`API error: ${response.status} - ${text}`);
      }
    } catch (error) {
      setApiStatuses(prev => ({ 
        ...prev, 
        contentManagerPost: `Error: ${error instanceof Error ? error.message : String(error)}` 
      }));
      addLog(`Exception: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test login - useful if not already logged in
  const testLogin = async () => {
    try {
      addLog('Redirecting to login page...');
      window.location.href = '/admin/login';
    } catch (error) {
      addLog(`Login navigation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Layout title="API Debug" section="admin">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">API Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status panel */}
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Authentication:</h3>
                <p className={isAuthenticated ? "text-green-600" : "text-red-600"}>
                  {authStatus}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Token:</h3>
                <p className={tokenStatus.includes('Error') ? "text-red-600" : "text-blue-600"}>
                  {tokenStatus}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Firestore:</h3>
                <p className={firestoreStatus.includes('not') ? "text-red-600" : "text-green-600"}>
                  {firestoreStatus}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">API Status:</h3>
                <ul className="space-y-2">
                  <li>
                    <span>GET: </span>
                    <span className={
                      apiStatuses.contentManagerGet.includes('Success') ? "text-green-600" : 
                      apiStatuses.contentManagerGet.includes('Testing') ? "text-blue-600" : 
                      apiStatuses.contentManagerGet.includes('Not tested') ? "text-gray-600" : 
                      "text-red-600"
                    }>
                      {apiStatuses.contentManagerGet}
                    </span>
                  </li>
                  <li>
                    <span>POST: </span>
                    <span className={
                      apiStatuses.contentManagerPost.includes('Success') ? "text-green-600" : 
                      apiStatuses.contentManagerPost.includes('Testing') ? "text-blue-600" : 
                      apiStatuses.contentManagerPost.includes('Not tested') ? "text-gray-600" : 
                      "text-red-600"
                    }>
                      {apiStatuses.contentManagerPost}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Test actions */}
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <button 
                    onClick={testContentManagerGet}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
                  >
                    Test GET API
                  </button>
                  
                  <button 
                    onClick={testContentManagerPost}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    disabled={!isAuthenticated}
                  >
                    Test POST API
                  </button>
                </div>
                
                <div>
                  <button 
                    onClick={testBasicEndpoint}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Test Basic Endpoint (No Middleware)
                  </button>
                </div>
              </div>
              
              {!isAuthenticated && (
                <div>
                  <button 
                    onClick={testLogin}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Go to Login
                  </button>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Environment Info:</h3>
                <ul className="text-sm text-gray-700">
                  <li>Firebase Auth Available: {firebaseAuth ? 'Yes' : 'No'}</li>
                  <li>Firestore Available: {firestoreInstance ? 'Yes' : 'No'}</li>
                  <li>NODE_ENV: {process.env.NODE_ENV}</li>
                  <li>Running on: {typeof window !== 'undefined' ? window.location.hostname : 'server'}</li>
                </ul>
              </div>
              
              <div className="mt-4">
                <a 
                  href="/admin/content-manager" 
                  className="text-blue-500 hover:underline"
                >
                  Go to Content Manager
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Logs panel */}
        <div className="mt-8 bg-gray-900 text-gray-200 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2 text-white">Debug Logs</h2>
          
          <div className="overflow-auto max-h-64 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs yet</p>
            ) : (
              <ul className="space-y-1">
                {logs.map((log, index) => (
                  <li key={index}>{log}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}