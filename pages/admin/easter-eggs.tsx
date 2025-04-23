import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useEasterEggs } from '@/lib/easter-eggs/manager';
import EasterEggTracker from '@/components/easter-eggs/EasterEggTracker';
import { useTranslation } from '@/lib/translations';
import { withAuth } from '@/lib/api/with-auth';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';

function EasterEggsAdminPage() {
  const { t } = useTranslation();
  const { getDiscoveredCount, getTotalCount } = useEasterEggs();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just a small delay to ensure Easter eggs are loaded
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const resetAllEasterEggs = () => {
    if (window.confirm('Are you sure you want to reset all discovered Easter eggs? This will make them undiscovered for all users.')) {
      try {
        // Reset Easter eggs using the easterEggManager
        // This is a client-side operation to reset the local storage state
        window.localStorage.removeItem('discoveredEasterEggs');
        
        // Reload the page to reflect changes
        window.location.reload();
      } catch (error) {
        console.error('Error resetting Easter eggs:', error);
        alert('There was an error resetting the Easter eggs.');
      }
    }
  };

  return (
    <AdminLayout loading={loading}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Easter Eggs Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and monitor Easter eggs hidden throughout the website.
            </p>
          </div>
          
          <button
            onClick={resetAllEasterEggs}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Reset All Discoveries
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Easter Eggs Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">Total Easter Eggs</div>
              <div className="text-3xl font-bold text-blue-800">{getTotalCount()}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">Discovered</div>
              <div className="text-3xl font-bold text-green-800">{getDiscoveredCount()}</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-600 mb-1">Remaining</div>
              <div className="text-3xl font-bold text-yellow-800">
                {getTotalCount() - getDiscoveredCount()}
              </div>
            </div>
          </div>
        </div>
        
        <EasterEggTracker showAll={true} />
        
        <div className="mt-8 bg-indigo-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-indigo-800 mb-2">How to Add New Easter Eggs</h2>
          <p className="text-indigo-700 mb-4">
            To add new Easter eggs to your website, follow these steps:
          </p>
          
          <ol className="list-decimal pl-5 space-y-2 text-indigo-700">
            <li>Define a new Easter egg in <code className="bg-indigo-100 px-1 rounded">lib/easter-eggs/implementations.ts</code></li>
            <li>Register it in the <code className="bg-indigo-100 px-1 rounded">registerAllEasterEggs()</code> function</li>
            <li>Add trigger points using <code className="bg-indigo-100 px-1 rounded">useEasterEggTrigger()</code> in components</li>
            <li>For custom trigger types, update the <code className="bg-indigo-100 px-1 rounded">EasterEggListener.tsx</code> component</li>
          </ol>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = withAuth(async (context: GetServerSidePropsContext) => {
  return {
    props: {}, // Will be passed to the page component as props
  };
});

export default EasterEggsAdminPage;
