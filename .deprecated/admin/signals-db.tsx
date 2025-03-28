/**
 * Final solution for signals admin - based on working patterns 
 * and with graceful fallbacks
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth';

// Define signal types
type SignalType = 'newsletter' | 'article';

interface SignalBase {
  id: string;
  type: SignalType;
  title: string;
  description: string;
  url: string;
  dateAdded: string;
  featured: boolean;
  tags: string[];
}

interface Newsletter extends SignalBase {
  type: 'newsletter';
  publisher: string;
  frequency: string;
}

interface Article extends SignalBase {
  type: 'article';
  author: string;
  source: string;
}

type Signal = Newsletter | Article;

// Simple loading component
function Loading() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2">Loading...</span>
    </div>
  );
}

export default function SignalsDbPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    type: 'newsletter' as SignalType,
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
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  // Load signals
  useEffect(() => {
    async function loadSignals() {
      try {
        addLog('Loading signals from signals-db endpoint');
        setIsLoading(true);
        
        const response = await fetch('/api/signals-db');
        addLog(`GET response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        addLog(`Signals loaded: ${data.data?.length || 0} items`);
        setSignals(data.data || []);
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        addLog(`Error loading signals: ${errorMessage}`);
        setError(`Error loading signals: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadSignals();
  }, []);

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      addLog('Submitting signal to signals-db endpoint');
      
      // Get token if available
      let headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add token if available (but continue without it if not)
      if (user) {
        try {
          const token = await user.getIdToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            addLog('Added auth token to request');
          }
        } catch (tokenError) {
          addLog('Could not get auth token, continuing without authentication');
        }
      } else {
        addLog('No user available, continuing without authentication');
      }
      
      // Prepare data
      const signalData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      };
      
      // Send to API
      const response = await fetch('/api/signals-db', {
        method: 'POST',
        headers,
        body: JSON.stringify(signalData),
      });
      
      addLog(`POST response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      addLog(`Signal created: ${result.data?.id || 'unknown ID'}`);
      
      if (result.mockOnly) {
        addLog('Note: Signal was created as mock only (not saved to database)');
      }
      
      // Clear form
      setFormData({
        type: 'newsletter' as SignalType,
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
      const getResponse = await fetch('/api/signals-db');
      const getData = await getResponse.json();
      setSignals(getData.data || []);
      
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error submitting signal: ${errorMessage}`);
      setError(`Error submitting signal: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>Signals Database Admin</title>
        <meta name="description" content="Signals database admin page" />
      </Head>

      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Signals Database Admin</h1>
        <p className="mb-4 text-gray-600">
          {user 
            ? `Logged in as ${user.email}` 
            : 'Not logged in - some features may be limited'}
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
              
              <div className="mb-3">
                <label className="block mb-1">Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              {formData.type === 'newsletter' && (
                <>
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
                  
                  <div className="mb-3">
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
              
              <div className="mb-3">
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
              
              <div className="mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Featured</span>
                </label>
              </div>
              
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
                          ? `Newsletter by ${(signal as Newsletter).publisher}` 
                          : `Article by ${(signal as Article).author} from ${(signal as Article).source}`}
                      </p>
                      <p className="text-sm mt-1">{signal.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
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