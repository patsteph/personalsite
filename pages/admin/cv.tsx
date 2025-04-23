import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { CVData } from '@/types/cv';
import toast from 'react-hot-toast';
import { fetchJson } from '@/lib/fetch-json';
import CVEditor from '@/components/admin/CVEditor';
import AdminLoading from '@/components/admin/AdminLoading';

export default function CVAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch CV data on page load
  useEffect(() => {
    async function fetchCvData() {
      try {
        setLoading(true);
        const response = await fetchJson('/api/admin/cv');
        
        if (response.success && response.data) {
          setCvData(response.data);
        } else {
          setError(response.error || 'Failed to load CV data');
          toast.error('Error loading CV data');
        }
      } catch (err) {
        setError('Failed to load CV data');
        toast.error('Error loading CV data');
        console.error('Error fetching CV data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCvData();
  }, []);
  
  // Save CV data
  const handleSave = async (updatedData: CVData) => {
    try {
      setSaving(true);
      const response = await fetchJson('/api/admin/cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (response.success) {
        setCvData(updatedData);
        toast.success('CV data saved successfully');
      } else {
        toast.error(response.error || 'Failed to save CV data');
      }
    } catch (err) {
      toast.error('Error saving CV data');
      console.error('Error saving CV data:', err);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <AdminLayout title="CV Management" section="cv">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          CV Management
        </h1>
        
        {loading ? (
          <AdminLoading message="Loading CV data..." />
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => router.reload()}
              className="mt-2 text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <CVEditor 
            initialData={cvData || undefined} 
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>
    </AdminLayout>
  );
}
