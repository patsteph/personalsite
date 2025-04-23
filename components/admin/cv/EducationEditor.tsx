import { useState } from 'react';
import { Education } from '@/types/cv';

type EducationEditorProps = {
  education: Education[];
  onChange: (education: Education[]) => void;
};

export default function EducationEditor({ education, onChange }: EducationEditorProps) {
  const [newEducation, setNewEducation] = useState<Education>({
    institution: '',
    degree: '',
    location: '',
    year: '',
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Handle adding a new education
  const handleAddEducation = () => {
    if (!newEducation.institution || !newEducation.degree || !newEducation.year) {
      alert('Please fill all required fields: Institution, Degree, and Year');
      return;
    }

    onChange([...education, newEducation]);
    setNewEducation({
      institution: '',
      degree: '',
      location: '',
      year: '',
    });
  };

  // Handle updating an existing education entry
  const handleUpdateEducation = (index: number) => {
    const updatedEducation = [...education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      ...newEducation
    };
    onChange(updatedEducation);
    setNewEducation({
      institution: '',
      degree: '',
      location: '',
      year: '',
    });
    setEditIndex(null);
  };

  // Load education data for editing
  const handleEditEducation = (index: number) => {
    setNewEducation({ ...education[index] });
    setEditIndex(index);
  };

  // Delete an education entry
  const handleDeleteEducation = (index: number) => {
    if (confirm('Are you sure you want to delete this education entry?')) {
      const updatedEducation = [...education];
      updatedEducation.splice(index, 1);
      onChange(updatedEducation);
      
      if (editIndex === index) {
        setEditIndex(null);
        setNewEducation({
          institution: '',
          degree: '',
          location: '',
          year: '',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-700">Education</h2>
      <p className="text-sm text-gray-500">
        Add your educational background, starting with the most recent.
      </p>

      {/* Add/Edit Education Form */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {editIndex !== null ? 'Edit Education' : 'Add New Education'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="education-institution" className="block text-sm font-medium text-gray-700 mb-1">
              Institution*
            </label>
            <input
              type="text"
              id="education-institution"
              value={newEducation.institution}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="education-degree" className="block text-sm font-medium text-gray-700 mb-1">
              Degree*
            </label>
            <input
              type="text"
              id="education-degree"
              value={newEducation.degree}
              onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="education-location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="education-location"
              value={newEducation.location || ''}
              onChange={(e) => setNewEducation({ ...newEducation, location: e.target.value })}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="education-year" className="block text-sm font-medium text-gray-700 mb-1">
              Year* (e.g. "2010 - 2014")
            </label>
            <input
              type="text"
              id="education-year"
              value={newEducation.year}
              onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
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
                  setNewEducation({
                    institution: '',
                    degree: '',
                    location: '',
                    year: '',
                  });
                }}
                className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateEducation(editIndex)}
                className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                Update Education
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddEducation}
              className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Add Education
            </button>
          )}
        </div>
      </div>

      {/* Education List */}
      {education.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Your Education ({education.length})
          </h3>

          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700">
              <div>Institution</div>
              <div>Degree</div>
              <div>Year</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-gray-200">
              {education.map((edu, index) => (
                <div key={index} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 px-4 py-3 items-center">
                  <div className="text-gray-900">{edu.institution}</div>
                  <div className="text-gray-900">{edu.degree}</div>
                  <div className="text-gray-600">{edu.year}</div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditEducation(index)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(index)}
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
