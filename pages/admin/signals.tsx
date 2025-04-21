// pages/admin/signals.tsx
import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SignalForm from '@/components/admin/SignalForm';
import { Signal, Newsletter, Article } from '@/lib/schemas/signals'; // Import schema definition
import { Signal as AppSignal } from '@/types'; // Restore AppSignal for form/component usage
import { fetchSignals as apiFetchSignals, addSignal as apiAddSignal, updateSignal as apiUpdateSignal, deleteSignal as apiDeleteSignal } from '@/lib/api/signals';

interface SignalsAdminPageProps {
  initialSignals: Signal[];
}

const SignalsAdminPage: React.FC<SignalsAdminPageProps> = ({ initialSignals }) => {
  // State for managing signals
  const [signals, setSignals] = useState<Signal[]>(initialSignals || []); // Store raw API/schema signals
  const [selectedSignal, setSelectedSignal] = useState<AppSignal | null>(null); // State holds AppSignal for the form
  const [isLoading, setIsLoading] = useState(false); // Start false if using initialSignals
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'newsletter' | 'article'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Clear messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage, error]);

  // Load signals when component mounts
  useEffect(() => {
    fetchSignals();
  }, []);

  // Fetch signals from API
  const fetchSignals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const signalsData = await apiFetchSignals(); // Use direct import
      if (signalsData && Array.isArray(signalsData)) {
        console.log(`Loaded ${signalsData.length} signals`);
        // Store the raw API/schema signals
        setSignals(signalsData as Signal[]);
      } else {
        console.error('Received non-array data for signals:', signalsData);
        setError('Failed to load signals: Invalid data format received.');
      }
    } catch (error) {
      console.error('Error loading signals:', error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform API/schema Signal data to AppSignal for the form/display
  const transformApiSignalToFormData = (apiSignal: Signal): AppSignal => {
    // Ensure all AppSignal fields are present and correctly typed
    return {
      id: apiSignal.id || '', // Ensure ID is string
      type: apiSignal.type,
      title: apiSignal.title,
      description: apiSignal.description,
      url: apiSignal.url,
      source: apiSignal.source || '', // Ensure source is string
      dateAdded: apiSignal.dateAdded ? new Date(apiSignal.dateAdded) : new Date(), // Convert to Date object
      updatedAt: apiSignal.updatedAt ? new Date(apiSignal.updatedAt) : undefined,
      featured: apiSignal.featured || false,
      tags: apiSignal.tags || [],
      imageUrl: apiSignal.imageUrl || undefined,
      // Add Article/Newsletter specific fields with defaults if needed
      publishDate: apiSignal.type === 'article' ? (apiSignal.publishDate ? new Date(apiSignal.publishDate) : undefined) : undefined,
      publisher: apiSignal.type === 'newsletter' ? (apiSignal.publisher || '') : undefined,
      status: apiSignal.status || 'published', // Default status if needed
    } as AppSignal; // Cast to the appropriate union type if necessary
  };

  // Transform AppSignal (from form) back to Partial<Signal> for the API call
  const transformFormDataToApiSignal = (formData: AppSignal): Partial<Signal> => {
    const apiData: Partial<Signal> = { ...formData };
    // Convert Date objects back to ISO strings for the API
    if (formData.dateAdded instanceof Date) {
      apiData.dateAdded = formData.dateAdded.toISOString();
    }
    if (formData.updatedAt instanceof Date) {
      apiData.updatedAt = formData.updatedAt.toISOString();
    }
    if (formData.publishDate instanceof Date) {
      apiData.publishDate = formData.publishDate.toISOString();
    }
    // Remove fields not present in the base Signal schema if necessary
    // delete apiData.someAppSpecificField;
    return apiData;
  };

  // Open editor for creating a new signal
  const handleNewSignal = () => {
    setSelectedSignal(null); // Clear selection for new form
    setIsFormOpen(true);
  };

  // Open editor for editing an existing signal
  const handleEditSignal = (signal: Signal) => {
    // Use the imported Signal type directly
    setSelectedSignal(transformApiSignalToFormData(signal)); // Transform schema signal to AppSignal for form
    setIsFormOpen(true);
  };

  // Handle signal creation/update from form
  const handleSaveSignal = async (formData: AppSignal) => { // Expect AppSignal from form
    setIsLoading(true);
    setError(null);
    const apiData = transformFormDataToApiSignal(formData); // Transform AppSignal to Partial<Signal> for API

    try {
      if (selectedSignal && selectedSignal.id) { // Check selectedSignal's ID for update
        // Update existing signal
        console.log('Updating signal with ID:', selectedSignal.id);
        const success = await apiUpdateSignal(selectedSignal.id, apiData); // Use direct import
        if (success) {
          setSuccessMessage('Signal updated successfully');
          fetchSignals(); // Reload signals
        } else {
          throw new Error('Failed to update signal');
        }
      } else {
        // Create new signal
        console.log('Creating new signal...');
        // AddSignal expects Omit<Signal, 'id'>, ensure apiData matches
        const newSignal = await apiAddSignal(apiData as Omit<Signal, 'id'>); // Use direct import
        if (newSignal) {
          setSuccessMessage('Signal created successfully');
          fetchSignals(); // Reload signals
        } else {
          throw new Error('Failed to create signal');
        }
      }
    } catch (error) {
      console.error('Error submitting signal:', error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle signal deletion
  const handleDeleteSignal = async (signalId: string) => {
    if (!window.confirm('Are you sure you want to delete this signal? This action cannot be undone.')) return;
    setIsLoading(true);
    setError(null);

    try {
      const success = await apiDeleteSignal(signalId); // Use direct import
      if (success) {
        setSuccessMessage('Signal deleted successfully');
        // Remove from local state instead of reloading full list
        setSignals(prev => prev.filter(signal => signal.id !== signalId));
      } else {
        throw new Error('Failed to delete signal');
      }
    } catch (error) {
      console.error('Error deleting signal:', error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter signals based on tab and search query
  const filteredSignals = signals.filter(signal => {
    const matchesType = activeTab === 'all' || signal.type === activeTab;
    const matchesSearch = !searchQuery || 
      signal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  // Format date for display
  const formatDate = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return 'N/A';
    let date: Date;
    try {
      // Attempt to parse the input as a Date
      // Strings should be in ISO format, Date objects are used directly
      if (dateInput === undefined || dateInput === null) {
        return 'N/A';
      }
      date = new Date(dateInput);

      // Check if the date is valid after parsing
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <ProtectedRoute>
      <Layout section="admin">
        <Head>
          <title>Manage Signals | Admin</title>
        </Head>

        <div className="container mx-auto px-4 py-8">
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
                Return to Dashboard
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {isFormOpen ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                {selectedSignal ? 'Edit Signal' : 'Create New Signal'}
              </h2>
              <SignalForm
                initialData={selectedSignal || undefined} // Pass AppSignal | undefined
                onSave={handleSaveSignal} // Ensure handleSaveSignal uses the correct types
                onCancel={() => setIsFormOpen(false)}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <>
              {/* Filters and Search */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 rounded-md ${
                      activeTab === 'all'
                        ? 'bg-steel-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({signals.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('newsletter')}
                    className={`px-3 py-1 rounded-md ${
                      activeTab === 'newsletter'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Newsletters ({signals.filter(s => s.type === 'newsletter').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('article')}
                    className={`px-3 py-1 rounded-md ${
                      activeTab === 'article'
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Articles ({signals.filter(s => s.type === 'article').length})
                  </button>
                </div>

                <div className="flex-grow">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search signals..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-3 top-2.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  onClick={fetchSignals}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                >
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              </div>

              {/* Signals Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Signal
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type / Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tags
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Added
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Featured
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSignals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                            No signals found. {signals.length > 0 ? 'Try a different filter.' : 'Create your first signal.'}
                          </td>
                        </tr>
                      ) : (
                        filteredSignals.map(signal => (
                          <tr key={signal.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {signal.imageUrl ? (
                                    <img className="h-10 w-10 rounded-sm object-cover" src={signal.imageUrl} alt={signal.title} />
                                  ) : (
                                    <div className="h-10 w-10 rounded-sm bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{signal.title}</div>
                                  <div className="text-sm text-gray-500">{signal.description.substring(0, 50)}...</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                signal.type === 'newsletter' 
                                  ? 'bg-indigo-100 text-indigo-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {signal.type}
                              </span>
                              <div className="text-sm text-gray-500 mt-1">
                                {signal.type === 'newsletter' 
                                  ? `${(signal as Newsletter).publisher} • ${(signal as Newsletter).frequency}` 
                                  : `${(signal as Article).author} • ${(signal as Article).source}`}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {signal.tags && signal.tags.length > 0 ? (
                                  signal.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">No tags</span>
                                )}
                                {signal.tags && signal.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{signal.tags.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(signal.dateAdded)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {signal.featured ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Yes
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  No
                                </span>
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
                                disabled={!signal.id} // Disable if no ID
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export const getServerSideProps: GetServerSideProps<SignalsAdminPageProps, ParsedUrlQuery> = async () => {
  try {
    // We'll load signals client-side for better reliability
    return {
      props: {
        signals: []
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    return {
      props: {
        signals: [],
        error: 'Failed to load signals. Please try refreshing the page.'
      }
    };
  }
};