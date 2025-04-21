import React, { useState, useEffect } from 'react';
import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import Head from 'next/head'; // Add missing Head import
import { ParsedUrlQuery } from 'querystring';
import { useRouter } from 'next/router'; // Import useRouter
import { 
  getAllSignals as apiFetchSignals, 
  addSignal as apiAddSignal, 
  updateSignal as apiUpdateSignal, 
  deleteSignal as apiDeleteSignal,
  sanitizeData // Import sanitizeData
} from '@/lib/api/signals';
import { SignalSchema, SignalSchemaType } from '@/lib/schemas/signals'; // Import Zod schema and type
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SignalForm from '@/components/admin/SignalForm';
// Import schema definition
import { Signal, Newsletter, Article } from '@/lib/schemas/signals';
// Restore AppSignal for form/component usage
import { Signal as AppSignal, Newsletter as AppNewsletter, Article as AppArticle } from '@/types'; // Import specific App types

interface SignalsAdminPageProps {
  initialSignals: SignalSchemaType[];
  serverError?: string;
}

const SignalsAdminPage: React.FC<SignalsAdminPageProps> = ({ initialSignals, serverError }) => {
  const router = useRouter(); // Initialize router

  // State
  const [signals, setSignals] = useState<SignalSchemaType[]>(initialSignals || []);
  const [selectedSignal, setSelectedSignal] = useState<AppSignal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(serverError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'newsletter' | 'article'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Clear messages
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer); // Cleanup timer
    }
    return; // Explicit return for warning ac0ccfdd
  }, [successMessage, error]); // Dependencies are correct

  // Fetch signals client-side if needed
  const fetchSignals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const signalsData = await apiFetchSignals();
      if (signalsData && Array.isArray(signalsData)) {
        console.log(`Loaded ${signalsData.length} signals from client-side fetch`);
        setSignals(signalsData as SignalSchemaType[]);
      } else {
        console.error('Received non-array data for signals:', signalsData);
        setError('Failed to load signals: Invalid data format received.');
      }
    } catch (error) {
      console.error('Error loading signals:', error);
      setError(`Error loading signals: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch if necessary
  useEffect(() => {
    if (!initialSignals?.length || serverError) {
      console.log('Initial signals empty or server error, fetching client-side...');
      fetchSignals();
    }
  }, [initialSignals, serverError]);

  // --- Transformation Functions --- 

  // Transform API/schema Signal -> AppSignal for Form/Component State
  const transformApiSignalToFormData = (apiSignal: SignalSchemaType): AppSignal => {
    // Helper to safely create Date objects
    const safeNewDate = (dateStr: string | undefined | null): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
      } catch { return undefined; }
    };

    const baseAppSignal = {
      id: apiSignal.id || '', // AppSignal expects an ID, generate if missing (shouldn't happen from API)
      title: apiSignal.title,
      description: apiSignal.description,
      url: apiSignal.url,
      imageUrl: apiSignal.imageUrl || undefined,
      dateAdded: apiSignal.dateAdded || new Date().toISOString(), // AppSignal needs dateAdded string
      featured: apiSignal.featured || false,
      tags: apiSignal.tags || [],
      // 'status' field removed
      // 'updatedAt' is not in AppSignal
    };

    if (apiSignal.type === 'article') {
      // Article specific fields from schema, ensuring required AppArticle fields have fallbacks
      return {
        ...baseAppSignal,
        type: 'article',
        author: apiSignal.author || '', // AppArticle requires author
        source: apiSignal.source || '', // AppArticle requires source
        publishDate: apiSignal.publishDate || new Date().toISOString(), // AppArticle requires publishDate string (type checked)
        readingTime: apiSignal.readingTime || undefined,
        affiliateCode: undefined, // Placeholder - not in schema
      } as AppArticle;
    } else if (apiSignal.type === 'newsletter') {
      // Newsletter specific fields from schema, ensuring required AppNewsletter fields have fallbacks
      return {
        ...baseAppSignal,
        type: 'newsletter',
        frequency: apiSignal.frequency as Newsletter['frequency'] || 'weekly', // AppNewsletter requires frequency (type checked)
        publisher: apiSignal.publisher || '', // AppNewsletter requires publisher
        subscriptionUrl: apiSignal.subscriptionUrl || '', // AppNewsletter requires subscriptionUrl
        sampleUrl: undefined, // Placeholder - not in schema
        affiliateCode: undefined, // Placeholder - not in schema
      } as AppNewsletter;
    }

    throw new Error(`Unknown signal type encountered during transformation: ${apiSignal.type}`);
  };

  // Transform AppSignal (Component State) -> Partial<SignalSchemaType> for API
  const transformFormDataToApiSignal = (formData: AppSignal): Partial<SignalSchemaType> => {
    const apiData: Partial<SignalSchemaType> & { [key: string]: any } = {
      // Base fields from AppSignal
      type: formData.type,
      title: formData.title,
      description: formData.description,
      url: formData.url,
      featured: formData.featured,
      tags: formData.tags,
      imageUrl: formData.imageUrl,
      dateAdded: formData.dateAdded, // Pass date string directly
      // 'id' is handled separately below
      // 'status' removed
    };

    // Type-specific fields
    if (formData.type === 'article') {
      // Map fields required by Zod Article schema
      apiData.author = formData.author;
      apiData.source = formData.source;
      apiData.publishDate = formData.publishDate; // Pass date string directly
      apiData.readingTime = formData.readingTime;
    } else if (formData.type === 'newsletter') {
      // Map fields required by Zod Newsletter schema
      apiData.publisher = formData.publisher;
      apiData.frequency = formData.frequency;
      apiData.subscriptionUrl = formData.subscriptionUrl;
    }

    // Convert undefined to null for Firestore compatibility (Memory faeee945)
    Object.keys(apiData).forEach(key => {
      if (apiData[key] === undefined) {
        apiData[key] = null;
      }
    });
    
    // Do NOT include 'id' in the data sent for add/update 
    // The API handler uses the URL parameter or generates a new one
    return apiData as Partial<SignalSchemaType>; 
  };

  // --- Event Handlers ---

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
    // Transform the AppSignal (from form state) to the shape the API expects
    const apiPayload = transformFormDataToApiSignal(formData);

    try {
      if (formData.id) { // Use ID from formData (which came from selectedSignal or was generated by form)
        console.log('Updating signal with ID:', formData.id, apiPayload);
        // Pass the ID within the object for update
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
        // addSignal expects the payload without an ID
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

  // --- Filtering and Sorting ---

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
    return dateB - dateA; // Newest first
  });

  // --- Utility Functions ---

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

  // --- Render --- 

  return (
    <ProtectedRoute>
      <Layout section="admin">
        <Head>
          <title>Manage Signals | Admin</title>
        </Head>

        <div className="container mx-auto px-4 py-8">
          {/* Header and Buttons */} 
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

          {/* Alerts */} 
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

          {/* Form View */} 
          {isFormOpen ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                {selectedSignal ? 'Edit Signal' : 'Create New Signal'}
              </h2>
              <SignalForm
                initialData={selectedSignal || undefined}
                onSubmit={handleSaveSignal} // Use onSubmit prop
                onCancel={() => setIsFormOpen(false)}
                isSubmitting={isSubmitting}
              />
            </div>
          ) : (
            /* Table View */ 
            <>
              {/* Filter and Search Controls */} 
              <div className="mb-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                {/* Tabs */} 
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
                {/* Search */} 
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
                {/* Refresh Button */} 
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

              {/* Signals Table */} 
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
                                onClick={() => handleEditSignal(signal)} // Pass schema Signal
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
      </Layout>
    </ProtectedRoute>
  );
};

export default SignalsAdminPage;

// getServerSideProps fetches initial data
export const getServerSideProps: GetServerSideProps<SignalsAdminPageProps> = async (): Promise<GetServerSidePropsResult<SignalsAdminPageProps>> => {
  try {
    const signalsFromApi = await apiFetchSignals();
    // Ensure the fetched data conforms to the Zod schema before passing as props
    const validatedSignals = signalsFromApi.map(s => SignalSchema.parse(sanitizeData(s))); // Validate and sanitize

    console.log(`Fetched ${validatedSignals.length} signals server-side`);
    return {
      props: {
        initialSignals: validatedSignals, // Type is now correctly SignalSchemaType[]
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