/**
 * Completely standalone signals page that uses browser localStorage
 * with zero dependencies on Firebase or external APIs
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';

// Define signal types for TypeScript
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
  imageUrl?: string;
}

interface Newsletter extends SignalBase {
  type: 'newsletter';
  publisher: string;
  frequency: string;
  subscriptionUrl?: string;
}

interface Article extends SignalBase {
  type: 'article';
  author: string;
  source: string;
  publishDate?: string;
}

type Signal = Newsletter | Article;

// Initial example data
const INITIAL_DATA: Signal[] = [
  {
    id: 'example-newsletter-1',
    type: 'newsletter',
    title: 'Example Newsletter',
    description: 'This is an example newsletter for demonstration purposes',
    url: 'https://example.com/newsletter',
    publisher: 'Example Publisher',
    frequency: 'weekly',
    dateAdded: new Date().toISOString(),
    featured: true,
    tags: ['example', 'demo']
  },
  {
    id: 'example-article-1',
    type: 'article',
    title: 'Example Article',
    description: 'This is an example article for demonstration purposes',
    url: 'https://example.com/article',
    author: 'Example Author',
    source: 'Example Source',
    dateAdded: new Date().toISOString(),
    featured: false,
    tags: ['example', 'article']
  }
];

// LocalStorage key
const STORAGE_KEY = 'local_signals_data';

export default function LocalSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Logging function
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp} - ${message}`, ...prev]);
  };

  // Load signals from localStorage
  useEffect(() => {
    const loadSignals = () => {
      try {
        addLog('Loading signals from localStorage');
        setIsLoading(true);
        
        // Try to get data from localStorage
        const storedData = localStorage.getItem(STORAGE_KEY);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setSignals(parsedData);
          addLog(`Loaded ${parsedData.length} signals from localStorage`);
        } else {
          // Initialize with example data
          addLog('No data in localStorage, using initial example data');
          setSignals(INITIAL_DATA);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
        }
      } catch (error) {
        addLog(`Error loading signals: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSignals();
  }, []);

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      addLog('Adding new signal to localStorage');
      
      // Prepare data
      const newSignal: Signal = formData.type === 'newsletter' 
        ? {
            id: `local-${Date.now()}`,
            type: 'newsletter',
            title: formData.title,
            description: formData.description,
            url: formData.url,
            publisher: formData.publisher,
            frequency: formData.frequency as string,
            dateAdded: new Date().toISOString(),
            featured: formData.featured,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            imageUrl: formData.imageUrl || undefined
          }
        : {
            id: `local-${Date.now()}`,
            type: 'article',
            title: formData.title,
            description: formData.description,
            url: formData.url,
            author: formData.author,
            source: formData.source,
            dateAdded: new Date().toISOString(),
            featured: formData.featured,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            imageUrl: formData.imageUrl || undefined
          };
      
      // Add to signals array
      const updatedSignals = [newSignal, ...signals];
      setSignals(updatedSignals);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSignals));
      
      addLog(`Signal saved: ${newSignal.title} (ID: ${newSignal.id})`);
      
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
    } catch (error) {
      addLog(`Error saving signal: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Delete a signal
  const handleDelete = (id: string) => {
    try {
      addLog(`Deleting signal: ${id}`);
      
      const updatedSignals = signals.filter(signal => signal.id !== id);
      setSignals(updatedSignals);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSignals));
      
      addLog('Signal deleted successfully');
    } catch (error) {
      addLog(`Error deleting signal: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>Local Signals Manager</title>
        <meta name="description" content="Local signals manager using browser localStorage" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Signals Manager (Local Storage)</h1>
        <p className="text-gray-600 mb-6">
          This page uses browser localStorage instead of Firebase - all data is stored locally in your browser.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
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
              
              <div className="mb-4">
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
              
              <div className="mb-4">
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
          <div>
            <div className="bg-white p-4 rounded shadow mb-6">
              <h2 className="text-xl font-semibold mb-4">Signals (Browser Storage)</h2>
              
              {isLoading ? (
                <p>Loading signals...</p>
              ) : signals.length === 0 ? (
                <p>No signals found.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {signals.map((signal) => (
                    <div key={signal.id} className="border-b pb-3">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{signal.title}</h3>
                        <button 
                          onClick={() => handleDelete(signal.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {signal.type === 'newsletter' 
                          ? `Newsletter by ${signal.publisher}` 
                          : `Article by ${signal.author} from ${signal.source}`}
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
            
            {/* Activity Log */}
            <div className="bg-gray-800 text-gray-200 p-3 rounded">
              <h2 className="text-lg font-semibold mb-2">Activity Log</h2>
              
              <div className="overflow-auto max-h-[200px] font-mono text-xs">
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