/**
 * Fully standalone signals admin page that doesn't depend on complex components
 * This should work regardless of issues with other components
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Simple loading component
function Loading() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2">Loading...</span>
    </div>
  );
}

export default function StandalonePage() {
  const router = useRouter();
  const [signals, setSignals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({
    type: 'newsletter',
    title: '',
    description: '',
    url: '',
    publisher: '',
    author: '',
    source: '',
  });

  // Function to add logs
  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  // Load mock signals on page load
  useEffect(() => {
    async function loadSignals() {
      try {
        addLog('Loading signals from standalone endpoint');
        setIsLoading(true);
        
        const response = await fetch('/api/standalone-signal');
        addLog(`GET response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        addLog(`Signals loaded: ${data.data?.length || 0} items`);
        setSignals(data.data || []);
      } catch (err) {
        addLog(`Error loading signals: ${err.message}`);
        setError(`Error loading signals: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadSignals();
  }, []);

  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      addLog('Submitting signal to standalone endpoint');
      
      // Send to API
      const response = await fetch('/api/standalone-signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      addLog(`POST response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      addLog(`Signal created: ${result.data?.id || 'unknown ID'}`);
      
      // Clear form
      setFormData({
        type: 'newsletter',
        title: '',
        description: '',
        url: '',
        publisher: '',
        author: '',
        source: '',
      });
      
      // Reload signals
      const getResponse = await fetch('/api/standalone-signal');
      const getData = await getResponse.json();
      setSignals(getData.data || []);
      
    } catch (err) {
      addLog(`Error submitting signal: ${err.message}`);
      setError(`Error submitting signal: ${err.message}`);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>Standalone Signals Page</title>
        <meta name="description" content="Standalone signals admin page for testing" />
      </Head>

      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Standalone Signals Admin</h1>
        <p className="mb-4 text-gray-600">
          This page is completely standalone and doesn't depend on complex components.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">Add New Signal</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="newsletter">Newsletter</option>
                  <option value="article">Article</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="mb-3">
                <label className="block mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              
              <div className="mb-3">
                <label className="block mb-1">URL *</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              
              {formData.type === 'newsletter' && (
                <div className="mb-3">
                  <label className="block mb-1">Publisher *</label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    required={formData.type === 'newsletter'}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
              
              {formData.type === 'article' && (
                <>
                  <div className="mb-3">
                    <label className="block mb-1">Author *</label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      required={formData.type === 'article'}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block mb-1">Source *</label>
                    <input
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      required={formData.type === 'article'}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </>
              )}
              
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Signal
              </button>
            </form>
          </div>
          
          {/* Signals List and Logs */}
          <div className="space-y-6">
            {/* Signals */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-3">Signals</h2>
              
              {isLoading ? (
                <Loading />
              ) : signals.length === 0 ? (
                <p>No signals found.</p>
              ) : (
                <div className="space-y-3">
                  {signals.map((signal) => (
                    <div key={signal.id} className="border-b pb-3">
                      <h3 className="font-medium">{signal.title}</h3>
                      <p className="text-sm text-gray-600">
                        {signal.type === 'newsletter' 
                          ? `Newsletter by ${signal.publisher}` 
                          : `Article by ${signal.author} from ${signal.source}`}
                      </p>
                      <p className="text-sm mt-1">{signal.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Logs */}
            <div className="bg-gray-800 text-gray-200 p-3 rounded">
              <h2 className="text-lg font-semibold mb-2">Activity Log</h2>
              
              <div className="overflow-auto max-h-40 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-400">No activity logged yet</p>
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
        </div>
      </div>
    </div>
  );
}