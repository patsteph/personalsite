import { useState } from 'react';
import { Certification } from '@/types/cv';

type TrainingEditorProps = {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
};

export default function TrainingEditor({ certifications, onChange }: TrainingEditorProps) {
  const [newCertification, setNewCertification] = useState<Certification>({
    name: '',
    year: ''
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Handle adding a new certification
  const handleAddCertification = () => {
    if (!newCertification.name || !newCertification.year) {
      alert('Please fill all required fields: Name and Year');
      return;
    }

    onChange([...certifications, newCertification]);
    setNewCertification({
      name: '',
      year: ''
    });
  };

  // Handle updating an existing certification
  const handleUpdateCertification = (index: number) => {
    const updatedCertifications = [...certifications];
    updatedCertifications[index] = {
      ...updatedCertifications[index],
      ...newCertification
    };
    onChange(updatedCertifications);
    setNewCertification({
      name: '',
      year: ''
    });
    setEditIndex(null);
  };

  // Load certification data for editing
  const handleEditCertification = (index: number) => {
    setNewCertification({ ...certifications[index] });
    setEditIndex(index);
  };

  // Delete a certification
  const handleDeleteCertification = (index: number) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      const updatedCertifications = [...certifications];
      updatedCertifications.splice(index, 1);
      onChange(updatedCertifications);
      
      if (editIndex === index) {
        setEditIndex(null);
        setNewCertification({
          name: '',
          year: ''
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-700">Training & Certifications</h2>
      <p className="text-sm text-gray-500">
        Add your professional certifications and training.
      </p>

      {/* Add/Edit Certification Form */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {editIndex !== null ? 'Edit Certification' : 'Add New Certification'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="certification-name" className="block text-sm font-medium text-gray-700 mb-1">
              Certification Name*
            </label>
            <input
              type="text"
              id="certification-name"
              value={newCertification.name}
              onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="certification-year" className="block text-sm font-medium text-gray-700 mb-1">
              Year*
            </label>
            <input
              type="text"
              id="certification-year"
              value={newCertification.year}
              onChange={(e) => setNewCertification({ ...newCertification, year: e.target.value })}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          {editIndex !== null ? (
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditIndex(null);
                  setNewCertification({
                    name: '',
                    year: ''
                  });
                }}
                className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateCertification(editIndex)}
                className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                Update Certification
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddCertification}
              className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Add Certification
            </button>
          )}
        </div>
      </div>

      {/* Certifications List */}
      {certifications.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Your Certifications ({certifications.length})
          </h3>

          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[2fr,1fr,auto] gap-2 px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700">
              <div>Name</div>
              <div>Year</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-gray-200">
              {certifications.map((cert, index) => (
                <div key={index} className="grid grid-cols-[2fr,1fr,auto] gap-2 px-4 py-3 items-center">
                  <div className="text-gray-900">{cert.name}</div>
                  <div className="text-gray-600">{cert.year}</div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditCertification(index)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCertification(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
