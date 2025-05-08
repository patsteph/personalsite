/**
 * Simple content manager page to add/edit signals
 * Using completely new naming pattern to avoid middleware issues
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { Signal } from '@/types/signals';

export default function ContentManagerPage() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Load existing signals
  useEffect(() => {
    async function loadSignals() {
      try {
        console.log('Loading signals with content manager endpoint (GET)');
        const response = await fetch('/api/content-manager-get');
        
        console.log('GET response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        console.log('Signals loaded:', data.data);
        setSignals(data.data || []);
      } catch (err: any) {
        console.error('Error loading signals:', err);
        setError(`Error loading signals: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadSignals();
    }
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
      console.log('Submitting signal to content manager endpoint');
      
      // Prepare data
      const signalData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      };
      
      console.log('Form data:', signalData);
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Send to API
      const response = await fetch('/api/content-manager-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(signalData),
      });
      
      console.log('POST response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      console.log('Signal created:', result);
      
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
      const getResponse = await fetch('/api/content-manager-get');
      const getData = await getResponse.json();
      setSignals(getData.data || []);
      
    } catch (err: any) {
      console.error('Error submitting signal:', err);
      setError(`Error submitting signal: ${err.message}`);
    }
  };

  // Test direct POST
  const testDirectPost = async () => {
    try {
      console.log('Testing direct POST with token:', user ? 'available' : 'not available');
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Basic test payload
      const testData = {
        type: 'newsletter',
        title: 'Test Newsletter',
        description: 'This is a test',
        url: 'https://example.com',
        publisher: 'Test Publisher',
        frequency: 'weekly',
        featured: false,
        tags: ['test'],
      };
      
      // Send to API
      const response = await fetch('/api/content-manager-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      });
      
      console.log('Direct POST test response:', response.status);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      console.log('Test POST succeeded:', result);
      
      // Reload signals
      const getResponse = await fetch('/api/content-manager-get');
      const getData = await getResponse.json();
      setSignals(getData.data || []);
      
    } catch (err: any) {
      console.error('Test POST failed:', err);
      setError(`Test POST failed: ${err.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>Content Manager | Admin</title>
      </Head>
      
      <AdminLayout pageTitle="Content Manager" loading={isLoading}>
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-6">Content Manager</h1>
          
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
            
            {/* List of existing signals */}
            <div>
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
                      <div className="mt-2 flex space-x-2">
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
          </div>
        </div>
      </AdminLayout>
    </>
  );
}