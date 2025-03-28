/**
 * Simple signals admin page that uses the basic implementation
 * Modeled after the successful pattern from the working endpoints
 */
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Signal } from '@/types/signals';

export default function SignalsBasicPage() {
  const { user, loading } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    type: 'newsletter',
    title: '',
    description: '',
    url: '',
    publisher: '',
    author: '',
    source: '',
    frequency: 'weekly',
    imageUrl: '',
    featured: false,
    tags: '',
  });

  // Function to add logs
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  // Load existing signals
  useEffect(() => {
    async function loadSignals() {
      if (!user) return;
      
      try {
        addLog('Loading signals with signals-basic endpoint (GET)');
        setIsLoading(true);
        const response = await fetch('/api/signals-basic');
        
        addLog(`GET response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        addLog(`Signals loaded: ${data.data?.length || 0} items`);
        setSignals(data.data || []);
      } catch (err: any) {
        addLog(`Error loading signals: ${err.message}`);
        setError(`Error loading signals: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadSignals();
  }, [user]);

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      addLog('Submitting signal to signals-basic endpoint');
      
      // Prepare data
      const signalData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      };
      
      addLog(`Form data prepared: ${JSON.stringify(signalData).substring(0, 100)}...`);
      
      // Get token from auth
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      // Send to API
      const response = await fetch('/api/signals-basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(signalData),
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
        frequency: 'weekly',
        imageUrl: '',
        featured: false,
        tags: '',
      });
      
      // Reload signals
      const getResponse = await fetch('/api/signals-basic');
      const getData = await getResponse.json();
      setSignals(getData.data || []);
      
    } catch (err: any) {
      addLog(`Error submitting signal: ${err.message}`);
      setError(`Error submitting signal: ${err.message}`);
    }
  };

  // Test direct POST
  const testDirectPost = async () => {
    try {
      addLog('Testing direct POST with token: ' + (user ? 'available' : 'not available'));
      
      // Get token from auth
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      // Basic test payload
      const testData = {
        type: 'newsletter',
        title: `Test Newsletter ${new Date().toISOString()}`,
        description: 'This is a test from signals-basic',
        url: 'https://example.com',
        publisher: 'Test Publisher',
        frequency: 'weekly',
        featured: false,
        tags: ['test', 'debug'],
      };
      
      addLog('Sending test data to API');
      
      // Send to API
      const response = await fetch('/api/signals-basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      });
      
      addLog(`Direct POST test response: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      addLog(`Test POST succeeded: ID=${result.data?.id || 'unknown'}`);
      
      // Reload signals
      const getResponse = await fetch('/api/signals-basic');
      const getData = await getResponse.json();
      setSignals(getData.data || []);
      
    } catch (err: any) {
      addLog(`Test POST failed: ${err.message}`);
      setError(`Test POST failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Signals Basic" section="admin">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Signals Basic Admin</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-8">
            <button
              onClick={testDirectPost}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Test Direct POST
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form for creating signals */}
            <div className="bg-white p-6 rounded shadow-md">
              <h2 className="text-xl font-semibold mb-4">Add New Signal</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
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
                
                <div className="mb-4">
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
                
                <div className="mb-4">
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
                
                <div className="mb-4">
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
                  <>
                    <div className="mb-4">
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
                    
                    <div className="mb-4">
                      <label className="block mb-1">Frequency</label>
                      <select
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
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
                
                {formData.type === 'article' && (
                  <>
                    <div className="mb-4">
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
                    
                    <div className="mb-4">
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
                
                <div className="mb-4">
                  <label className="block mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    placeholder="tech, ai, programming"
                  />
                </div>
                
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Signal
                </button>
              </form>
            </div>
            
            {/* List of existing signals */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Existing Signals</h2>
                
                {isLoading ? (
                  <p>Loading signals...</p>
                ) : signals.length === 0 ? (
                  <p>No signals found.</p>
                ) : (
                  <div className="space-y-4">
                    {signals.map((signal) => (
                      <div key={signal.id} className="bg-white p-4 rounded shadow">
                        <h3 className="font-semibold">{signal.title}</h3>
                        <p className="text-sm text-gray-500">
                          {signal.type === 'newsletter' 
                            ? `Newsletter by ${(signal as any).publisher}` 
                            : `Article by ${(signal as any).author} from ${(signal as any).source}`}
                        </p>
                        <p className="mt-1">{signal.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {signal.tags?.map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Activity Log */}
              <div className="mt-6 bg-gray-900 text-gray-200 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2 text-white">Activity Log</h3>
                <div className="overflow-auto max-h-48 font-mono text-sm">
                  {logs.length === 0 ? (
                    <p className="text-gray-400">No activity yet</p>
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
      </Layout>
    </ProtectedRoute>
  );
}