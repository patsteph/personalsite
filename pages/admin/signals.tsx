import React, { useState, useEffect } from 'react';
import Head from 'next/head'; 
import { GetServerSideProps, GetServerSidePropsResult, GetServerSidePropsContext } from 'next'; 
import { useRouter } from 'next/router'; 
import { 
  addSignal as apiAddSignal, 
  updateSignal as apiUpdateSignal, 
  deleteSignal as apiDeleteSignal,
  sanitizeData 
} from '@/lib/api/signals';
import { SignalSchema, SignalSchemaType } from '@/lib/schemas/signals'; 
import AdminLayout from '@/components/admin/AdminLayout';
import SignalForm from '@/components/admin/SignalForm';

import { Signal, Newsletter, Article } from '@/lib/schemas/signals';
import { Signal as AppSignal, Newsletter as AppNewsletter, Article as AppArticle } from '@/types'; 

interface SignalsAdminPageProps { 
  initialSignals: SignalSchemaType[];
  serverError?: string;
}

const SignalsAdminPage: React.FC<SignalsAdminPageProps> = ({ initialSignals, serverError }) => {
  const router = useRouter(); 

  const [signals, setSignals] = useState<SignalSchemaType[]>(initialSignals || []);
  const [selectedSignal, setSelectedSignal] = useState<AppSignal | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(serverError || null); 
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'newsletter' | 'article'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer); 
    }
    return; 
  }, [successMessage, error]); 

  const fetchSignals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Token logic removed - HttpOnly cookie 'fb_token' sent automatically by browser
      const signalsData = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/signals`);
      const result = await signalsData.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error('API response format invalid or indicates failure.');
      }

      const signalsFromApi: any[] = result.data; 

      const validatedSignals = signalsFromApi.map((s: any) => SignalSchema.parse(sanitizeData(s))); 

      console.log(`Loaded ${validatedSignals.length} signals from client-side fetch`);
      setSignals(validatedSignals as SignalSchemaType[]);
    } catch (error) {
      console.error('Error loading signals:', error);
      setError(`Error loading signals: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const transformApiSignalToFormData = (apiSignal: SignalSchemaType): AppSignal => {
    const safeNewDate = (dateStr: string | undefined | null): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
      } catch { return undefined; }
    };

    const baseAppSignal = {
      id: apiSignal.id || '', 
      title: apiSignal.title,
      description: apiSignal.description,
      url: apiSignal.url,
      imageUrl: apiSignal.imageUrl || undefined,
      dateAdded: apiSignal.dateAdded || new Date().toISOString(), 
      featured: apiSignal.featured || false,
      tags: apiSignal.tags || [],
    };

    if (apiSignal.type === 'article') {
      return {
        ...baseAppSignal,
        type: 'article',
        author: apiSignal.author || '', 
        source: apiSignal.source || '', 
        publishDate: apiSignal.publishDate || new Date().toISOString(), 
        readingTime: apiSignal.readingTime || undefined,
        affiliateCode: undefined, 
      } as AppArticle;
    } else if (apiSignal.type === 'newsletter') {
      return {
        ...baseAppSignal,
        type: 'newsletter',
        frequency: apiSignal.frequency || 'weekly', 
        publisher: apiSignal.publisher || '', 
        subscriptionUrl: apiSignal.subscriptionUrl || '', 
        sampleUrl: undefined, 
        affiliateCode: undefined, 
      } as AppNewsletter;
    }

    throw new Error(`Unknown signal type encountered during transformation: ${apiSignal.type}`);
  };

  const transformFormDataToApiSignal = (formData: AppSignal): Partial<SignalSchemaType> => {
    const apiData: Partial<SignalSchemaType> & { [key: string]: any } = {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      url: formData.url,
      featured: formData.featured,
      tags: formData.tags,
      imageUrl: formData.imageUrl,
      dateAdded: formData.dateAdded, 
    };

    if (formData.type === 'article') {
      apiData.author = formData.author;
      apiData.source = formData.source;
      apiData.publishDate = formData.publishDate; 
      apiData.readingTime = formData.readingTime;
    } else if (formData.type === 'newsletter') {
      apiData.publisher = formData.publisher;
      apiData.frequency = formData.frequency;
      apiData.subscriptionUrl = formData.subscriptionUrl;
    }

    Object.keys(apiData).forEach(key => {
      if (apiData[key] === undefined) {
        apiData[key] = null;
      }
    });
    
    return apiData as Partial<SignalSchemaType>; 
  };

  const handleNewSignal = () => {
    setSelectedSignal(null);
    setIsFormOpen(true);
  };

  const handleEditSignal = (signal: SignalSchemaType) => {
    setSelectedSignal(transformApiSignalToFormData(signal));
    setIsFormOpen(true);
  };

  const handleSaveSignal = async (formData: AppSignal) => {
    setIsSubmitting(true);
    setError(null);
    const apiPayload = transformFormDataToApiSignal(formData);

    try {
      if (formData.id) { 
        console.log('Updating signal with ID:', formData.id, apiPayload);
        const success = await apiUpdateSignal({ id: formData.id, ...apiPayload }); 
        if (success) {
          setSuccessMessage('Signal updated successfully');
          fetchSignals();
          setIsFormOpen(false);
        } else {
          throw new Error('Failed to update signal via API');
        }
      } else {
        console.log('Creating new signal...', apiPayload);
        const newSignal = await apiAddSignal(apiPayload as Omit<SignalSchemaType, 'id'>);
        if (newSignal) {
          setSuccessMessage('Signal created successfully');
          fetchSignals();
          setIsFormOpen(false);
        } else {
          throw new Error('Failed to create signal via API');
        }
      }
    } catch (error) {
      console.error('Error submitting signal:', error);
      setError(`Error saving signal: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    if (!window.confirm('Are you sure you want to delete this signal? This action cannot be undone.')) return;
    setIsLoading(true);
    setError(null);
    try {
      const success = await apiDeleteSignal(signalId);
      if (success) {
        setSuccessMessage('Signal deleted successfully');
        setSignals(prev => prev.filter(signal => signal.id !== signalId));
      } else {
        throw new Error('Failed to delete signal via API');
      }
    } catch (error) {
      console.error('Error deleting signal:', error);
      setError(`Error deleting signal: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSignals = signals.filter(signal => {
    const matchesType = activeTab === 'all' || signal.type === activeTab;
    const matchesSearch = !searchQuery ||
      signal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const sortedSignals = [...filteredSignals].sort((a, b) => {
    const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
    const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
    return dateB - dateA; 
  });

  const formatDate = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return 'N/A';
    let date: Date;
    try {
      if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        date = new Date(dateInput);
      }
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US');
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return 'Invalid date';
    }
  };

  return (
    <>
      <Head>
        <title>Manage Signals | Admin</title>
      </Head>
      
      <AdminLayout pageTitle="Manage Signals" loading={isLoading}>
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-steel-blue">Manage Signals</h1>
            <div className="flex space-x-4">
              {!isFormOpen && (
                <button
                  onClick={handleNewSignal}
                  className="px-4 py-2 bg-steel-blue text-white rounded-md hover:bg-opacity-90"
                >
                  Add New Signal
                </button>
              )}
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Back to Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded" role="alert">
              {successMessage}
            </div>
          )}

          {isFormOpen ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                {selectedSignal ? 'Edit Signal' : 'Create New Signal'}
              </h2>
              <SignalForm
                initialData={selectedSignal || undefined}
                onSubmit={handleSaveSignal} 
                onCancel={() => setIsFormOpen(false)}
                isSubmitting={isSubmitting}
              />
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-md">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 rounded-md text-sm ${activeTab === 'all' ? 'bg-steel-blue text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    All ({signals.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('newsletter')}
                    className={`px-3 py-1 rounded-md text-sm ${activeTab === 'newsletter' ? 'bg-steel-blue text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    Newsletters ({signals.filter(s => s.type === 'newsletter').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('article')}
                    className={`px-3 py-1 rounded-md text-sm ${activeTab === 'article' ? 'bg-steel-blue text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    Articles ({signals.filter(s => s.type === 'article').length})
                  </button>
                </div>
                <div className="flex-grow">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search signals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-steel-blue"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                </div>
                <button
                  onClick={fetchSignals}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  {isLoading && !signals.length ? (
                    <p className="p-4 text-center text-gray-500">Loading signals...</p>
                  ) : sortedSignals.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                          <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedSignals.map((signal) => (
                          <tr key={signal.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                <a href={signal.url} target="_blank" rel="noopener noreferrer" className="hover:text-steel-blue">
                                  {signal.title}
                                </a>
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{signal.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                signal.type === 'newsletter' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {signal.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{signal.source || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(signal.dateAdded)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {signal.featured ? (
                                <span className="text-green-600 font-semibold">Yes</span>
                              ) : (
                                <span className="text-gray-500">No</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditSignal(signal)} 
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  const id = signal.id;
                                  if (id) {
                                    handleDeleteSignal(id);
                                  } else {
                                    console.error('Attempted to delete signal with no ID:', signal);
                                    setError('Cannot delete signal: Missing ID.');
                                  }
                                }}
                                disabled={!signal.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="p-4 text-center text-gray-500">{isLoading ? 'Loading...' : 'No signals found matching your criteria.'}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </>
  );
};

export default SignalsAdminPage;

export const getServerSideProps: GetServerSideProps<SignalsAdminPageProps> = async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<SignalsAdminPageProps>> => {
  try {
    const token = context.req.cookies['fb_token']; 

    if (!token) {
      console.log('getServerSideProps: No fb_token found in cookies. Redirecting to login.');
      return {
        redirect: { 
          destination: '/login', 
          permanent: false,
        },
      };
    }

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = context.req.headers.host || process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000'; 
    const apiUrl = `${protocol}://${host}/api/signals`;
    console.log(`getServerSideProps: Fetching signals from internal API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      console.error('getServerSideProps: API response format invalid:', result);
      throw new Error('API response format invalid or indicates failure.');
    }

    const signalsFromApi: any[] = result.data; 

    const validatedSignals = signalsFromApi.map((s: any) => SignalSchema.parse(sanitizeData(s))); 

    console.log(`getServerSideProps: Fetched ${validatedSignals.length} signals server-side.`);
    return {
      props: {
        initialSignals: validatedSignals, 
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps fetching signals:', error);
    return {
      props: {
        initialSignals: [], 
        serverError: `Failed to load initial signals: ${error instanceof Error ? error.message : String(error)}`, 
      },
    };
  }
}; 